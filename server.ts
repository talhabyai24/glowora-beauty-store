import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import {
  approveOrderPayment,
  claimAdminPasscodeOnce,
  createOrder,
  createReview,
  deleteProductById,
  finalizeJazzCashOrder,
  getAdminCredential,
  getAllOrders,
  getAllProducts,
  getAllReviews,
  getAllSections,
  getOrderById,
  getOrdersByEmail,
  getPaymentSettings,
  getPaymentTransactionLogs,
  getProductBySlug,
  getReviewsByEmail,
  getSeoSettings,
  hasDuplicateTransactionReference,
  RECEIPTS_DIR,
  rejectOrderPayment,
  reorderSections,
  savePaymentSettings,
  saveSeoSettings,
  seedAllDefaultSections,
  seedDatabaseIfEmpty,
  subscribeNewsletter,
  updateOrderStatus,
  updateSection,
  upsertProduct,
  verifyStoredAdminPasscode,
} from './server/db.ts';
import type {
  PaymentMethod,
  PaymentSettings,
  Product,
  SectionId,
  SeoSettings,
} from './src/types/glowora.ts';

seedDatabaseIfEmpty();

const PORT = Number(process.env.PORT || 3000);
const SESSION_SIGNING_KEY = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const RECEIPT_FILENAME_REGEX = /^[a-f0-9-]+\.(png|jpg|webp|pdf)$/;
const ALLOWED_RECEIPT_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp', 'application/pdf']);

const VALID_PAYMENT_METHODS: Set<string> = new Set([
  'jazzcash',
  'bank_transfer',
  'cod',
  'card',
]);

const VALID_SECTION_IDS: Set<string> = new Set([
  'announcement_bar',
  'header',
  'hero_banner',
  'categories',
  'featured_products',
  'best_sellers',
  'new_arrivals',
  'promotional_banner',
  'flash_sale',
  'brand_story',
  'why_choose_us',
  'featured_collection',
  'customer_reviews',
  'beauty_blog',
  'instagram_gallery',
  'newsletter',
  'faq',
  'footer',
]);

function isSafeUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function sanitizeConfigUrls(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeConfigUrls);
  }
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (
        typeof value === 'string' &&
        (key.toLowerCase().includes('url') ||
          key.toLowerCase().includes('image') ||
          key.toLowerCase().includes('target'))
      ) {
        out[key] = isSafeUrl(value) ? value.trim() : '#';
      } else {
        out[key] = sanitizeConfigUrls(value);
      }
    }
    return out;
  }
  return obj;
}

function signAdminToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ role: 'admin', exp: Date.now() + TOKEN_TTL_MS })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SIGNING_KEY).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SIGNING_KEY)
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    return decoded.role === 'admin' && typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'Invalid or expired admin session.' });
    return;
  }
  next();
}

function verifyEnvPasscode(candidate: string): boolean {
  const envPass = process.env.ADMIN_PASSCODE?.trim();
  if (!envPass) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(envPass);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatJazzCashTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    String(date.getFullYear()) +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

function computeJazzCashSecureHash(
  params: Record<string, string>,
  integritySalt: string
): string {
  const keys = Object.keys(params)
    .filter((k) => k.startsWith('pp_') && k !== 'pp_SecureHash' && String(params[k] || '').length > 0)
    .sort();
  const hashString = [integritySalt, ...keys.map((k) => String(params[k]))].join('&');
  return crypto.createHmac('sha256', integritySalt).update(hashString).digest('hex').toUpperCase();
}

function verifyJazzCashSecureHash(
  params: Record<string, unknown>,
  integritySalt: string
): boolean {
  const receivedRaw = typeof params.pp_SecureHash === 'string' ? params.pp_SecureHash.trim().toUpperCase() : '';
  if (!receivedRaw) return false;
  const flatParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (k.startsWith('pp_') && k !== 'pp_SecureHash' && v !== undefined && v !== null) {
      flatParams[k] = String(v);
    }
  }
  const expected = computeJazzCashSecureHash(flatParams, integritySalt);
  const a = Buffer.from(receivedRaw, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function detectReceiptExtension(buffer: Buffer, declaredMime: string): { ext: string; mime: string } | null {
  if (buffer.length < 12) return null;
  if (
    declaredMime === 'image/png' &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { ext: 'png', mime: 'image/png' };
  }
  if (
    declaredMime === 'image/jpeg' &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  if (
    declaredMime === 'image/webp' &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }
  if (declaredMime === 'application/pdf' && buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    return { ext: 'pdf', mime: 'application/pdf' };
  }
  return null;
}

async function startServer() {
  const app = express();
  app.use('/api/payments/bank/receipt', express.json({ limit: '8mb' }));
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/payments/jazzcash/callback', express.urlencoded({ extended: false }));

  // Technical SEO endpoints: robots.txt and dynamic XML sitemap
  app.get('/robots.txt', (req, res) => {
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nSitemap: ${baseUrl.replace(/\/$/, '')}/sitemap.xml\n`
    );
  });

  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`).replace(/\/$/, '');
    const products = getAllProducts();
    const sections = getAllSections().filter((s) => s.enabled);
    const today = new Date().toISOString().split('T')[0];

    const urls = [
      `<url><loc>${escapeXml(baseUrl)}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
      ...sections.map(
        (s) =>
          `<url><loc>${escapeXml(baseUrl)}/#${escapeXml(s.id)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
      ),
      ...products.map(
        (p) =>
          `<url><loc>${escapeXml(baseUrl)}/?product=${escapeXml(p.slug)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
      ),
    ];

    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`
    );
  });

  // Public storefront hydration
  app.get('/api/storefront', (_req, res) => {
    try {
      const sections = getAllSections();
      const products = getAllProducts();
      const reviews = getAllReviews();
      const paymentSettings = getPaymentSettings();
      const seoSettings = getSeoSettings();
      res.json({ sections, products, reviews, paymentSettings, seoSettings });
    } catch {
      res.status(500).json({ error: 'Failed to load storefront data.' });
    }
  });

  app.get('/api/products', (req, res) => {
    try {
      const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
      const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
      let products = getAllProducts();
      if (category && category !== 'All') {
        products = products.filter((p) => p.category.toLowerCase() === category.toLowerCase());
      }
      if (q) {
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        );
      }
      res.json({ products });
    } catch {
      res.status(500).json({ error: 'Failed to query products.' });
    }
  });

  app.post('/api/reviews', (req, res) => {
    try {
      const { authorName, authorEmail, authorRole, rating, productName, quote } = req.body ?? {};
      if (
        typeof authorName !== 'string' ||
        authorName.trim().length < 2 ||
        typeof quote !== 'string' ||
        quote.trim().length < 10
      ) {
        res.status(400).json({ error: 'Please provide your name and a detailed review.' });
        return;
      }
      const cleanRating = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));
      const cleanEmail =
        typeof authorEmail === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail.trim())
          ? authorEmail.trim().slice(0, 120)
          : '';

      const review = createReview({
        authorName: authorName.trim().slice(0, 80),
        authorEmail: cleanEmail,
        authorRole:
          typeof authorRole === 'string' && authorRole.trim()
            ? authorRole.trim().slice(0, 80)
            : 'Verified Client',
        avatarUrl: '/src/assets/images/editorial_beauty_portrait_1795461009923.jpg',
        rating: cleanRating,
        productName:
          typeof productName === 'string' && productName.trim()
            ? productName.trim().slice(0, 120)
            : 'GLOWORA Collection',
        quote: quote.trim().slice(0, 500),
      });
      res.status(201).json({ review });
    } catch {
      res.status(500).json({ error: 'Failed to submit review.' });
    }
  });

  app.post('/api/newsletter', (req, res) => {
    try {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }
      const result = subscribeNewsletter(email);
      res.status(201).json(result);
    } catch {
      res.status(500).json({ error: 'Failed to subscribe.' });
    }
  });

  // Direct COD / Card order creation
  app.post('/api/orders', (req, res) => {
    try {
      const {
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        postalCode,
        paymentMethod,
        paymentReference,
        items,
      } = req.body ?? {};

      const method = typeof paymentMethod === 'string' ? paymentMethod : 'cod';
      if (!VALID_PAYMENT_METHODS.has(method)) {
        res.status(400).json({ error: 'Invalid payment method selected.' });
        return;
      }

      if (method === 'jazzcash' || method === 'bank_transfer') {
        res.status(400).json({
          error: 'Please use the dedicated JazzCash Gateway or Bank Transfer submission flow.',
        });
        return;
      }

      const settings = getPaymentSettings();
      if (method === 'cod' && !settings.codEnabled) {
        res.status(400).json({ error: 'Cash on Delivery is currently disabled.' });
        return;
      }
      if (method === 'card' && !settings.cardEnabled) {
        res.status(400).json({ error: 'Card payment is currently disabled.' });
        return;
      }

      if (
        typeof customerName !== 'string' ||
        customerName.trim().length < 2 ||
        typeof customerEmail !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim()) ||
        typeof customerPhone !== 'string' ||
        customerPhone.trim().length < 7 ||
        typeof shippingAddress !== 'string' ||
        shippingAddress.trim().length < 6 ||
        !Array.isArray(items) ||
        items.length === 0
      ) {
        res.status(400).json({
          error: 'Complete name, email, phone number, shipping address, and at least one item are required.',
        });
        return;
      }

      const cleanRef = typeof paymentReference === 'string' ? paymentReference.trim() : '';
      const parsedItems = items.map((item: { productId?: unknown; quantity?: unknown }) => ({
        productId: String(item.productId || ''),
        quantity: Number(item.quantity || 1),
      }));

      const order = createOrder({
        customerName: customerName.trim().slice(0, 100),
        customerEmail: customerEmail.trim().slice(0, 120),
        customerPhone: customerPhone.trim().slice(0, 40),
        shippingAddress: shippingAddress.trim().slice(0, 240),
        postalCode: typeof postalCode === 'string' ? postalCode.trim().slice(0, 20) : '',
        paymentMethod: method as PaymentMethod,
        paymentReference: cleanRef.slice(0, 100),
        items: parsedItems,
      });

      res.status(201).json({ order });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to place order.';
      res.status(400).json({ error: message });
    }
  });

  // Official JazzCash Merchant Gateway Initiation (server-side HMAC-SHA256)
  app.post('/api/payments/jazzcash/initiate', async (req, res) => {
    try {
      const body = req.body ?? {};
      // Explicitly forbid accepting or logging MPIN / PIN / OTP
      if ('mpin' in body || 'pin' in body || 'otp' in body) {
        res.status(400).json({ error: 'Sensitive wallet credentials such as MPIN or OTP must never be sent to the store.' });
        return;
      }

      const settings = getPaymentSettings();
      if (!settings.jazzcashEnabled) {
        res.status(400).json({ error: 'JazzCash payment is currently disabled by the store administrator.' });
        return;
      }

      const merchantId = process.env.JAZZCASH_MERCHANT_ID?.trim();
      const merchantPassword = process.env.JAZZCASH_PASSWORD?.trim();
      const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT?.trim();
      if (!merchantId || !merchantPassword || !integritySalt) {
        res.status(503).json({
          configured: false,
          error:
            'JazzCash Merchant Gateway credentials are not configured on the server. Add JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, and JAZZCASH_INTEGRITY_SALT in server environment secrets.',
        });
        return;
      }

      const {
        orderId,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        postalCode,
        jazzcashMobile,
        items,
      } = body;

      if (
        typeof customerName !== 'string' ||
        customerName.trim().length < 2 ||
        typeof customerEmail !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim()) ||
        typeof customerPhone !== 'string' ||
        customerPhone.trim().length < 7 ||
        typeof shippingAddress !== 'string' ||
        shippingAddress.trim().length < 6 ||
        !Array.isArray(items) ||
        items.length === 0
      ) {
        res.status(400).json({
          error: 'Complete name, email, phone, shipping address, and at least one item are required.',
        });
        return;
      }

      const cleanWallet = typeof jazzcashMobile === 'string' ? jazzcashMobile.replace(/[\s-]/g, '').trim() : '';
      if (!/^03\d{9}$/.test(cleanWallet)) {
        res.status(400).json({
          error: 'Enter a valid 11-digit JazzCash mobile number (03XXXXXXXXX).',
        });
        return;
      }

      const safeOrderId =
        typeof orderId === 'string' && /^GLW-\d{6}$/.test(orderId.trim())
          ? orderId.trim()
          : `GLW-${Math.floor(100000 + Math.random() * 899999)}`;

      if (getOrderById(safeOrderId)) {
        res.status(409).json({ error: 'Order reference already exists. Refresh checkout and retry.' });
        return;
      }

      const now = new Date();
      const expiry = new Date(now.getTime() + 60 * 60 * 1000);
      const txnRefNo = `T${formatJazzCashTimestamp(now)}${crypto.randomInt(100, 999)}`;

      const parsedItems = items.map((item: { productId?: unknown; quantity?: unknown }) => ({
        productId: String(item.productId || ''),
        quantity: Number(item.quantity || 1),
      }));

      const order = createOrder({
        orderId: safeOrderId,
        customerName: customerName.trim().slice(0, 100),
        customerEmail: customerEmail.trim().slice(0, 120),
        customerPhone: customerPhone.trim().slice(0, 40),
        shippingAddress: shippingAddress.trim().slice(0, 240),
        postalCode: typeof postalCode === 'string' ? postalCode.trim().slice(0, 20) : '',
        paymentMethod: 'jazzcash',
        paymentReference: txnRefNo,
        paymentStatusOverride: 'Initiated',
        orderStatusOverride: 'Awaiting JazzCash Payment',
        items: parsedItems,
      });

      const gatewayUrlRaw =
        process.env.JAZZCASH_GATEWAY_URL?.trim() ||
        'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction';

      let parsedGatewayUrl: URL;
      try {
        parsedGatewayUrl = new URL(gatewayUrlRaw);
        if (parsedGatewayUrl.protocol !== 'https:') {
          throw new Error('JazzCash Gateway URL must use HTTPS.');
        }
      } catch {
        finalizeJazzCashOrder({
          orderId: order.id,
          txnRefNo,
          success: false,
          gatewayCode: 'CONFIG_ERR',
          message: 'Invalid JazzCash Gateway URL configuration.',
        });
        res.status(500).json({ error: 'Invalid JazzCash Gateway URL configuration.' });
        return;
      }

      const baseAppUrl = (
        process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`
      ).replace(/\/$/, '');
      const returnUrl = process.env.JAZZCASH_RETURN_URL?.trim() || `${baseAppUrl}/api/payments/jazzcash/callback`;
      const amountInMinorUnits = String(Math.round(order.total * 100));

      const isHostedRedirect = parsedGatewayUrl.pathname.toLowerCase().includes('customerportal');

      const ppParams: Record<string, string> = {
        pp_Version: isHostedRedirect ? '1.1' : '2.0',
        pp_TxnType: 'MWALLET',
        pp_Language: 'EN',
        pp_MerchantID: merchantId,
        pp_Password: merchantPassword,
        pp_TxnRefNo: txnRefNo,
        pp_Amount: amountInMinorUnits,
        pp_TxnCurrency: 'PKR',
        pp_TxnDateTime: formatJazzCashTimestamp(now),
        pp_TxnExpiryDateTime: formatJazzCashTimestamp(expiry),
        pp_BillReference: order.id,
        pp_Description: `GLOWORA Order ${order.id}`,
        pp_MobileNumber: cleanWallet,
        ...(isHostedRedirect ? { pp_ReturnURL: returnUrl } : {}),
      };

      ppParams.pp_SecureHash = computeJazzCashSecureHash(ppParams, integritySalt);

      if (isHostedRedirect) {
        res.json({
          mode: 'redirect',
          gatewayUrl: parsedGatewayUrl.toString(),
          formFields: ppParams,
          order,
        });
        return;
      }

      // Server-to-server official REST DoMWalletTransaction call (never trusting client)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      try {
        const gatewayRes = await fetch(parsedGatewayUrl.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ppParams),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const rawText = await gatewayRes.text();
        let gatewayData: Record<string, unknown> = {};
        try {
          gatewayData = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
          gatewayData = { pp_ResponseCode: String(gatewayRes.status), pp_ResponseMessage: rawText.slice(0, 200) };
        }

        // Verify response integrity if pp_SecureHash is returned by gateway
        if (gatewayData.pp_SecureHash && !verifyJazzCashSecureHash(gatewayData, integritySalt)) {
          const failedOrder = finalizeJazzCashOrder({
            orderId: order.id,
            txnRefNo,
            success: false,
            gatewayCode: 'HASH_MISMATCH',
            message: 'JazzCash response signature verification failed.',
          });
          res.status(400).json({
            error: 'Payment gateway response signature could not be verified.',
            order: failedOrder,
          });
          return;
        }

        const respCode = String(gatewayData.pp_ResponseCode || '');
        const respMessage = String(gatewayData.pp_ResponseMessage || 'Gateway responded.');
        const respAmount = gatewayData.pp_Amount ? String(gatewayData.pp_Amount) : amountInMinorUnits;
        const respTxnRef = String(gatewayData.pp_TxnRefNo || txnRefNo);

        const isSuccess = respCode === '000' && respAmount === amountInMinorUnits;
        const isCancelled = respCode === '999';

        const updatedOrder = finalizeJazzCashOrder({
          orderId: order.id,
          txnRefNo: respTxnRef,
          success: isSuccess,
          cancelled: isCancelled,
          gatewayCode: respCode || 'UNKNOWN',
          message: respMessage,
        });

        res.status(isSuccess ? 200 : 402).json({
          mode: 'api',
          success: isSuccess,
          cancelled: isCancelled,
          gatewayCode: respCode,
          gatewayMessage: respMessage,
          order: updatedOrder,
        });
      } catch (fetchErr) {
        clearTimeout(timeout);
        const failedOrder = finalizeJazzCashOrder({
          orderId: order.id,
          txnRefNo,
          success: false,
          gatewayCode: 'NETWORK_ERR',
          message: fetchErr instanceof Error ? fetchErr.message : 'Gateway request failed.',
        });
        res.status(502).json({
          error: 'Could not reach the official JazzCash Merchant Gateway. Please verify gateway connectivity and try again.',
          order: failedOrder,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to initiate JazzCash payment.';
      res.status(400).json({ error: message });
    }
  });

  // Hosted JazzCash Checkout Redirect Return Handler
  app.post('/api/payments/jazzcash/callback', (req, res) => {
    const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT?.trim();
    const payload = (req.body || {}) as Record<string, unknown>;
    const orderId = typeof payload.pp_BillReference === 'string' ? payload.pp_BillReference.trim() : '';
    const txnRefNo = typeof payload.pp_TxnRefNo === 'string' ? payload.pp_TxnRefNo.trim() : orderId;
    const respCode = typeof payload.pp_ResponseCode === 'string' ? payload.pp_ResponseCode.trim() : '';
    const respMessage =
      typeof payload.pp_ResponseMessage === 'string' ? payload.pp_ResponseMessage.trim() : '';
    const respAmount = typeof payload.pp_Amount === 'string' ? payload.pp_Amount.trim() : '';

    if (!integritySalt || !orderId) {
      res.redirect('/?payment=failed&reason=invalid_callback');
      return;
    }

    const order = getOrderById(orderId);
    if (!order) {
      res.redirect('/?payment=failed&reason=order_not_found');
      return;
    }

    const hashValid = verifyJazzCashSecureHash(payload, integritySalt);
    const expectedAmount = String(Math.round(order.total * 100));
    const amountMatches = respAmount === expectedAmount;
    const isCancelled = respCode === '999';
    const isSuccess = hashValid && amountMatches && respCode === '000';

    finalizeJazzCashOrder({
      orderId: order.id,
      txnRefNo,
      success: isSuccess,
      cancelled: isCancelled,
      gatewayCode: hashValid ? respCode : 'HASH_MISMATCH',
      message: hashValid ? respMessage || 'JazzCash callback processed.' : 'Invalid pp_SecureHash on callback.',
    });

    const outcome = isSuccess ? 'success' : isCancelled ? 'cancelled' : 'failed';
    res.redirect(`/?payment=${outcome}&orderId=${encodeURIComponent(order.id)}`);
  });

  // Cancel an initiated JazzCash order if customer explicitly cancels
  app.post('/api/payments/jazzcash/cancel', (req, res) => {
    const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId.trim() : '';
    const existing = orderId ? getOrderById(orderId) : null;
    if (!existing) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    if (existing.paymentStatus !== 'Initiated') {
      res.status(400).json({ error: 'Only awaiting JazzCash orders can be cancelled.' });
      return;
    }
    const updated = finalizeJazzCashOrder({
      orderId: existing.id,
      txnRefNo: existing.paymentReference || existing.id,
      success: false,
      cancelled: true,
      gatewayCode: '999',
      message: 'Customer cancelled JazzCash checkout.',
    });
    res.json({ order: updated });
  });

  // Bank Transfer: Secure Receipt Upload (MIME + Magic Byte Validation)
  app.post('/api/payments/bank/receipt', (req, res) => {
    try {
      const { mimeType, dataBase64 } = req.body ?? {};
      if (typeof mimeType !== 'string' || !ALLOWED_RECEIPT_MIMES.has(mimeType)) {
        res.status(400).json({ error: 'Receipt must be PNG, JPG, WEBP, or PDF.' });
        return;
      }
      if (typeof dataBase64 !== 'string' || !dataBase64.trim()) {
        res.status(400).json({ error: 'Receipt file content is required.' });
        return;
      }

      const cleaned = dataBase64.includes(',') ? dataBase64.split(',').pop() || '' : dataBase64;
      const buffer = Buffer.from(cleaned, 'base64');
      if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) {
        res.status(400).json({ error: 'Receipt file must be non-empty and under 5 MB.' });
        return;
      }

      const detected = detectReceiptExtension(buffer, mimeType);
      if (!detected) {
        res.status(400).json({ error: 'Uploaded file signature does not match an allowed image or PDF.' });
        return;
      }

      const filename = `${crypto.randomUUID()}.${detected.ext}`;
      const targetPath = path.resolve(RECEIPTS_DIR, filename);
      if (!targetPath.startsWith(RECEIPTS_DIR + path.sep)) {
        res.status(400).json({ error: 'Invalid receipt target path.' });
        return;
      }

      fs.writeFileSync(targetPath, buffer);
      res.status(201).json({ filename });
    } catch {
      res.status(500).json({ error: 'Failed to store uploaded receipt.' });
    }
  });

  // Bank Transfer Submission (always Pending Verification, never auto-approved)
  app.post('/api/payments/bank/submit', (req, res) => {
    try {
      const settings = getPaymentSettings();
      if (!settings.bankEnabled) {
        res.status(400).json({ error: 'Bank Transfer is currently disabled.' });
        return;
      }
      if (!settings.bankName.trim() || !settings.bankAccountNumber.trim()) {
        res.status(503).json({
          error: 'Bank account details have not been configured by the store owner yet.',
        });
        return;
      }

      const {
        orderId,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        postalCode,
        paymentReference,
        paymentDate,
        receiptFilename,
        items,
      } = req.body ?? {};

      if (
        typeof customerName !== 'string' ||
        customerName.trim().length < 2 ||
        typeof customerEmail !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim()) ||
        typeof customerPhone !== 'string' ||
        customerPhone.trim().length < 7 ||
        typeof shippingAddress !== 'string' ||
        shippingAddress.trim().length < 6 ||
        !Array.isArray(items) ||
        items.length === 0
      ) {
        res.status(400).json({
          error: 'Complete shipping details and at least one item are required.',
        });
        return;
      }

      const cleanRef = typeof paymentReference === 'string' ? paymentReference.trim() : '';
      if (cleanRef.length < 4) {
        res.status(400).json({ error: 'Please enter a valid Bank Transaction ID (TID).' });
        return;
      }
      if (hasDuplicateTransactionReference(cleanRef)) {
        res.status(409).json({
          error: 'This Transaction ID has already been submitted for another order.',
        });
        return;
      }

      const cleanDate = typeof paymentDate === 'string' ? paymentDate.trim() : '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        res.status(400).json({ error: 'Please enter a valid payment date.' });
        return;
      }

      const cleanReceipt = typeof receiptFilename === 'string' ? receiptFilename.trim() : '';
      if (!RECEIPT_FILENAME_REGEX.test(cleanReceipt)) {
        res.status(400).json({ error: 'Please upload your bank transfer payment receipt.' });
        return;
      }
      const receiptPath = path.resolve(RECEIPTS_DIR, cleanReceipt);
      if (!receiptPath.startsWith(RECEIPTS_DIR + path.sep) || !fs.existsSync(receiptPath)) {
        res.status(400).json({ error: 'Uploaded payment receipt could not be found. Please re-upload.' });
        return;
      }

      const safeOrderId =
        typeof orderId === 'string' && /^GLW-\d{6}$/.test(orderId.trim())
          ? orderId.trim()
          : `GLW-${Math.floor(100000 + Math.random() * 899999)}`;

      const parsedItems = items.map((item: { productId?: unknown; quantity?: unknown }) => ({
        productId: String(item.productId || ''),
        quantity: Number(item.quantity || 1),
      }));

      const order = createOrder({
        orderId: safeOrderId,
        customerName: customerName.trim().slice(0, 100),
        customerEmail: customerEmail.trim().slice(0, 120),
        customerPhone: customerPhone.trim().slice(0, 40),
        shippingAddress: shippingAddress.trim().slice(0, 240),
        postalCode: typeof postalCode === 'string' ? postalCode.trim().slice(0, 20) : '',
        paymentMethod: 'bank_transfer',
        paymentReference: cleanRef.slice(0, 100),
        paymentDate: cleanDate,
        receiptFilename: cleanReceipt,
        paymentStatusOverride: 'Pending Verification',
        orderStatusOverride: 'Pending Bank Verification',
        items: parsedItems,
      });

      res.status(201).json({ order });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to submit bank transfer details.';
      res.status(400).json({ error: message });
    }
  });

  app.get('/api/orders/lookup', (req, res) => {
    try {
      const email = typeof req.query.email === 'string' ? req.query.email.trim() : '';
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ error: 'Valid email required for order lookup.' });
        return;
      }
      const orders = getOrdersByEmail(email);
      res.json({ orders });
    } catch {
      res.status(500).json({ error: 'Order lookup failed.' });
    }
  });

  app.get('/api/account/summary', (req, res) => {
    try {
      const email = typeof req.query.email === 'string' ? req.query.email.trim() : '';
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ error: 'Valid account email is required.' });
        return;
      }
      const orders = getOrdersByEmail(email);
      const reviews = getReviewsByEmail(email);
      res.json({ orders, reviews });
    } catch {
      res.status(500).json({ error: 'Failed to load account summary.' });
    }
  });

  // Admin auth status + bootstrap + login
  app.get('/api/admin/auth-status', (_req, res) => {
    const envConfigured = Boolean(process.env.ADMIN_PASSCODE?.trim());
    const claimed = Boolean(getAdminCredential());
    res.json({ envConfigured, claimed });
  });

  app.post('/api/admin/claim', (req, res) => {
    const envConfigured = Boolean(process.env.ADMIN_PASSCODE?.trim());
    if (envConfigured) {
      res.status(409).json({ error: 'Admin passcode is configured via environment variables.' });
      return;
    }
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
    if (passcode.length < 6 || passcode.length > 64) {
      res.status(400).json({ error: 'Passcode must be between 6 and 64 characters.' });
      return;
    }
    const claimed = claimAdminPasscodeOnce(passcode);
    if (!claimed) {
      res.status(409).json({ error: 'Admin passcode has already been claimed.' });
      return;
    }
    const token = signAdminToken();
    res.status(201).json({ token });
  });

  app.post('/api/admin/login', (req, res) => {
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
    if (!passcode) {
      res.status(400).json({ error: 'Passcode is required.' });
      return;
    }
    const envPass = process.env.ADMIN_PASSCODE?.trim();
    const valid = envPass ? verifyEnvPasscode(passcode) : verifyStoredAdminPasscode(passcode);
    if (!valid) {
      res.status(401).json({ error: 'Incorrect admin passcode.' });
      return;
    }
    const token = signAdminToken();
    res.json({ token });
  });

  // Protected Admin Section Builder routes
  app.put('/api/admin/sections/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    if (!VALID_SECTION_IDS.has(id)) {
      res.status(404).json({ error: 'Section not found.' });
      return;
    }
    const { enabled, label, config } = req.body ?? {};
    const sanitizedConfig =
      config && typeof config === 'object'
        ? (sanitizeConfigUrls(config) as Record<string, unknown>)
        : undefined;

    const updated = updateSection(id as SectionId, {
      enabled: typeof enabled === 'boolean' ? enabled : undefined,
      label: typeof label === 'string' && label.trim() ? label.trim().slice(0, 80) : undefined,
      config: sanitizedConfig,
    });
    if (!updated) {
      res.status(404).json({ error: 'Section not found.' });
      return;
    }
    res.json({ section: updated });
  });

  app.post('/api/admin/sections/reorder', requireAdmin, (req, res) => {
    const orderedIds = req.body?.orderedIds;
    if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== 'string' || !VALID_SECTION_IDS.has(id))) {
      res.status(400).json({ error: 'Invalid section order list.' });
      return;
    }
    const sections = reorderSections(orderedIds);
    res.json({ sections });
  });

  app.post('/api/admin/sections/reset', requireAdmin, (_req, res) => {
    seedAllDefaultSections();
    const sections = getAllSections();
    res.json({ sections });
  });

  // Protected Admin Product CRUD routes
  app.post('/api/admin/products', requireAdmin, (req, res) => {
    try {
      const body = req.body ?? {};
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const category = typeof body.category === 'string' ? body.category.trim().slice(0, 60) : '';
      const price = Number(body.price);

      if (name.length < 2 || category.length < 2 || !Number.isFinite(price) || price <= 0) {
        res.status(400).json({ error: 'Valid product name, category, and positive price are required.' });
        return;
      }

      const rawOriginal = body.originalPrice ? Number(body.originalPrice) : null;
      const originalPrice = rawOriginal && rawOriginal > price ? Number(rawOriginal.toFixed(2)) : null;
      const discountPercent = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
      const imageUrl =
        typeof body.imageUrl === 'string' && isSafeUrl(body.imageUrl)
          ? body.imageUrl.trim()
          : '/src/assets/images/product_elixir_serum_1795461007227.jpg';

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const id =
        typeof body.id === 'string' && body.id.trim()
          ? body.id.trim()
          : `prod-${crypto.randomUUID().slice(0, 8)}`;

      const existingSlug = getProductBySlug(slug);
      if (existingSlug && existingSlug.id !== id) {
        res.status(409).json({
          error: 'A product with this name already exists. Edit the existing single product instead.',
        });
        return;
      }

      // Enforce single showcase placement so no product repeats across sections
      const isFlashSale = Boolean(body.isFlashSale);
      const isNewArrival = !isFlashSale && Boolean(body.isNewArrival);
      const isBestseller = !isFlashSale && !isNewArrival && Boolean(body.isBestseller);
      const isFeatured = !isFlashSale && !isNewArrival && !isBestseller && Boolean(body.isFeatured);

      const productPayload: Omit<Product, 'createdAt'> = {
        id,
        name: name.slice(0, 120),
        slug,
        category,
        collectionTag:
          typeof body.collectionTag === 'string' && body.collectionTag.trim()
            ? body.collectionTag.trim().slice(0, 80)
            : `${category} Collection`,
        description:
          typeof body.description === 'string' && body.description.trim()
            ? body.description.trim().slice(0, 500)
            : 'Luxury small-batch botanical formulation crafted by GLOWORA.',
        ingredients:
          typeof body.ingredients === 'string' && body.ingredients.trim()
            ? body.ingredients.trim().slice(0, 300)
            : 'Cold-pressed botanical lipids, peptides, tocopherol.',
        price: Number(price.toFixed(2)),
        originalPrice,
        discountPercent,
        rating: Math.min(5, Math.max(1, Number(body.rating) || 4.9)),
        reviewCount: Math.max(0, Math.floor(Number(body.reviewCount) || 12)),
        imageUrl,
        stock: Math.max(0, Math.floor(Number(body.stock) ?? 25)),
        isFeatured,
        isBestseller,
        isNewArrival,
        isFlashSale,
        badgeText: typeof body.badgeText === 'string' ? body.badgeText.trim().slice(0, 40) : '',
      };

      const saved = upsertProduct(productPayload);
      res.status(201).json({ product: saved });
    } catch {
      res.status(500).json({ error: 'Failed to save product.' });
    }
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    const deleted = deleteProductById(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    res.json({ deleted: true });
  });

  app.get('/api/admin/orders', requireAdmin, (_req, res) => {
    const orders = getAllOrders();
    res.json({ orders });
  });

  app.put('/api/admin/orders/:id', requireAdmin, (req, res) => {
    const { status, paymentStatus } = req.body ?? {};
    const updated = updateOrderStatus(req.params.id, {
      status: typeof status === 'string' ? status.trim().slice(0, 80) : undefined,
      paymentStatus: typeof paymentStatus === 'string' ? paymentStatus.trim().slice(0, 80) : undefined,
    });
    if (!updated) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    res.json({ order: updated });
  });

  // Admin Payment Management endpoints
  app.get('/api/admin/payments', requireAdmin, (req, res) => {
    const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const methodFilter = typeof req.query.method === 'string' ? req.query.method.trim() : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

    const allOrders = getAllOrders();
    const pendingCount = allOrders.filter((o) => o.paymentStatus === 'Pending Verification').length;

    let filtered = allOrders;
    if (statusFilter && statusFilter !== 'All') {
      filtered = filtered.filter((o) => o.paymentStatus === statusFilter);
    }
    if (methodFilter && methodFilter !== 'All') {
      filtered = filtered.filter((o) => o.paymentMethod === methodFilter);
    }
    if (q) {
      filtered = filtered.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.paymentReference.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q)
      );
    }

    const logs = getPaymentTransactionLogs();
    res.json({ orders: filtered, logs, pendingCount });
  });

  app.post('/api/admin/payments/:id/approve', requireAdmin, (req, res) => {
    const updated = approveOrderPayment(req.params.id);
    if (!updated) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    res.json({ order: updated });
  });

  app.post('/api/admin/payments/:id/reject', requireAdmin, (req, res) => {
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (reason.length < 3) {
      res.status(400).json({ error: 'Please provide a clear rejection reason (minimum 3 characters).' });
      return;
    }
    const updated = rejectOrderPayment(req.params.id, reason.slice(0, 240));
    if (!updated) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    res.json({ order: updated });
  });

  app.get('/api/admin/receipts/:filename', requireAdmin, (req, res) => {
    const filename = req.params.filename;
    if (!RECEIPT_FILENAME_REGEX.test(filename)) {
      res.status(400).json({ error: 'Invalid receipt identifier.' });
      return;
    }
    const fullPath = path.resolve(RECEIPTS_DIR, filename);
    if (!fullPath.startsWith(RECEIPTS_DIR + path.sep) || !fs.existsSync(fullPath)) {
      res.status(404).json({ error: 'Receipt file not found.' });
      return;
    }
    const ext = path.extname(filename).toLowerCase();
    const mime =
      ext === '.png'
        ? 'image/png'
        : ext === '.jpg'
          ? 'image/jpeg'
          : ext === '.webp'
            ? 'image/webp'
            : 'application/pdf';
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.type(mime).sendFile(fullPath);
  });

  app.put('/api/admin/settings/payment', requireAdmin, (req, res) => {
    const body = req.body as Partial<PaymentSettings>;
    const current = getPaymentSettings();
    const next: PaymentSettings = {
      jazzcashEnabled: typeof body.jazzcashEnabled === 'boolean' ? body.jazzcashEnabled : current.jazzcashEnabled,
      jazzcashDisplayName:
        typeof body.jazzcashDisplayName === 'string'
          ? body.jazzcashDisplayName.trim().slice(0, 80)
          : current.jazzcashDisplayName,
      jazzcashInstructions:
        typeof body.jazzcashInstructions === 'string'
          ? body.jazzcashInstructions.trim().slice(0, 300)
          : current.jazzcashInstructions,
      bankEnabled: typeof body.bankEnabled === 'boolean' ? body.bankEnabled : current.bankEnabled,
      bankName: typeof body.bankName === 'string' ? body.bankName.trim().slice(0, 80) : current.bankName,
      bankAccountTitle:
        typeof body.bankAccountTitle === 'string'
          ? body.bankAccountTitle.trim().slice(0, 80)
          : current.bankAccountTitle,
      bankAccountNumber:
        typeof body.bankAccountNumber === 'string'
          ? body.bankAccountNumber.trim().slice(0, 60)
          : current.bankAccountNumber,
      bankIban: typeof body.bankIban === 'string' ? body.bankIban.trim().slice(0, 60) : current.bankIban,
      bankSwiftCode:
        typeof body.bankSwiftCode === 'string'
          ? body.bankSwiftCode.trim().slice(0, 30)
          : current.bankSwiftCode,
      bankInstructions:
        typeof body.bankInstructions === 'string'
          ? body.bankInstructions.trim().slice(0, 300)
          : current.bankInstructions,
      codEnabled: typeof body.codEnabled === 'boolean' ? body.codEnabled : current.codEnabled,
      cardEnabled: typeof body.cardEnabled === 'boolean' ? body.cardEnabled : current.cardEnabled,
    };
    res.json({ paymentSettings: savePaymentSettings(next) });
  });

  app.put('/api/admin/settings/seo', requireAdmin, (req, res) => {
    const body = req.body as Partial<SeoSettings>;
    const current = getSeoSettings();
    const next: SeoSettings = {
      metaTitle: typeof body.metaTitle === 'string' ? body.metaTitle.trim().slice(0, 90) : current.metaTitle,
      metaDescription:
        typeof body.metaDescription === 'string'
          ? body.metaDescription.trim().slice(0, 180)
          : current.metaDescription,
      keywords: typeof body.keywords === 'string' ? body.keywords.trim().slice(0, 300) : current.keywords,
      ogImage:
        typeof body.ogImage === 'string' && isSafeUrl(body.ogImage)
          ? body.ogImage.trim()
          : current.ogImage,
    };
    res.json({ seoSettings: saveSeoSettings(next) });
  });

  // Vite dev middleware or static dist serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GLOWORA server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
