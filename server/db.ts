import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { buildDefaultSections, DEFAULT_PRODUCTS, DEFAULT_REVIEWS } from './seedData.ts';
import type {
  Order,
  PaymentMethod,
  PaymentSettings,
  PaymentTransactionLog,
  Product,
  Review,
  SectionId,
  SeoSettings,
  StoreSection,
} from '../src/types/glowora.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const RECEIPTS_DIR = path.join(DATA_DIR, 'receipts');
if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'glowora.db');
const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    category TEXT NOT NULL,
    collection_tag TEXT NOT NULL,
    description TEXT NOT NULL,
    ingredients TEXT NOT NULL,
    price REAL NOT NULL,
    original_price REAL,
    discount_percent INTEGER NOT NULL DEFAULT 0,
    rating REAL NOT NULL DEFAULT 4.9,
    review_count INTEGER NOT NULL DEFAULT 0,
    image_url TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 25,
    is_featured INTEGER NOT NULL DEFAULT 0,
    is_bestseller INTEGER NOT NULL DEFAULT 0,
    is_new_arrival INTEGER NOT NULL DEFAULT 0,
    is_flash_sale INTEGER NOT NULL DEFAULT 0,
    badge_text TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL,
    config_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL DEFAULT '',
    author_role TEXT NOT NULL,
    avatar_url TEXT NOT NULL,
    rating INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    quote TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL DEFAULT '',
    shipping_address TEXT NOT NULL,
    postal_code TEXT NOT NULL DEFAULT '',
    payment_method TEXT NOT NULL DEFAULT 'cod',
    payment_reference TEXT NOT NULL DEFAULT '',
    payment_status TEXT NOT NULL DEFAULT 'Pending Verification',
    payment_date TEXT NOT NULL DEFAULT '',
    receipt_filename TEXT NOT NULL DEFAULT '',
    rejection_reason TEXT NOT NULL DEFAULT '',
    items_json TEXT NOT NULL,
    subtotal REAL NOT NULL,
    shipping_fee REAL NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payment_transactions (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    txn_ref_no TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'PKR',
    status TEXT NOT NULL,
    gateway_code TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    actor TEXT NOT NULL DEFAULT 'system',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_config (
    id TEXT PRIMARY KEY,
    passcode_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS store_settings (
    id TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

function ensureColumnExists(tableName: string, columnName: string, alterSql: string) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  if (!columns.some((c) => c.name === columnName)) {
    db.exec(alterSql);
  }
}

ensureColumnExists('reviews', 'author_email', `ALTER TABLE reviews ADD COLUMN author_email TEXT NOT NULL DEFAULT ''`);
ensureColumnExists('orders', 'customer_phone', `ALTER TABLE orders ADD COLUMN customer_phone TEXT NOT NULL DEFAULT ''`);
ensureColumnExists('orders', 'postal_code', `ALTER TABLE orders ADD COLUMN postal_code TEXT NOT NULL DEFAULT ''`);
ensureColumnExists('orders', 'payment_method', `ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cod'`);
ensureColumnExists('orders', 'payment_reference', `ALTER TABLE orders ADD COLUMN payment_reference TEXT NOT NULL DEFAULT ''`);
ensureColumnExists('orders', 'payment_status', `ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'Pending Verification'`);
ensureColumnExists('orders', 'payment_date', `ALTER TABLE orders ADD COLUMN payment_date TEXT NOT NULL DEFAULT ''`);
ensureColumnExists('orders', 'receipt_filename', `ALTER TABLE orders ADD COLUMN receipt_filename TEXT NOT NULL DEFAULT ''`);
ensureColumnExists('orders', 'rejection_reason', `ALTER TABLE orders ADD COLUMN rejection_reason TEXT NOT NULL DEFAULT ''`);

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  jazzcashEnabled: true,
  jazzcashDisplayName: 'GLOWORA Official JazzCash',
  jazzcashInstructions:
    'Enter your JazzCash mobile account number to connect securely with the official JazzCash Merchant Gateway.',
  bankEnabled: true,
  bankName: '',
  bankAccountTitle: '',
  bankAccountNumber: '',
  bankIban: '',
  bankSwiftCode: '',
  bankInstructions:
    'Transfer the exact order total to the official GLOWORA bank account below, upload your payment receipt, and enter your Transaction ID for verification.',
  codEnabled: true,
  cardEnabled: true,
};

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  metaTitle: 'GLOWORA – Luxury Botanical Skincare, Makeup & Fragrances',
  metaDescription:
    'Shop GLOWORA luxury skincare serums, velvet lipsticks, and rare amber fragrances with express delivery, JazzCash, and bank transfer.',
  keywords:
    'GLOWORA, luxury skincare, botanical serum, velvet matte lipstick, amber oud perfume, beauty tools, JazzCash beauty store',
  ogImage: '/src/assets/images/hero_luxury_beauty_1795461007331.jpg',
};

export function seedDatabaseIfEmpty() {
  const now = new Date().toISOString();

  const revisionRow = db.prepare('SELECT value_json FROM store_settings WHERE id = ?').get('seed_revision') as
    | { value_json: string }
    | undefined;
  const seedRevision = revisionRow ? JSON.parse(revisionRow.value_json) : null;
  const TARGET_SEED_REVISION = 'v3_editorial_real';

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  const overlapCheck = db
    .prepare(
      'SELECT COUNT(*) as count FROM products WHERE (is_featured + is_bestseller + is_new_arrival + is_flash_sale) > 1'
    )
    .get() as { count: number };

  if (productCount.count === 0 || overlapCheck.count > 0 || seedRevision !== TARGET_SEED_REVISION) {
    const insertProduct = db.prepare(`
      INSERT OR REPLACE INTO products (
        id, name, slug, category, collection_tag, description, ingredients,
        price, original_price, discount_percent, rating, review_count,
        image_url, stock, is_featured, is_bestseller, is_new_arrival,
        is_flash_sale, badge_text, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of DEFAULT_PRODUCTS) {
      insertProduct.run(
        p.id,
        p.name,
        p.slug,
        p.category,
        p.collectionTag,
        p.description,
        p.ingredients,
        p.price,
        p.originalPrice,
        p.discountPercent,
        p.rating,
        p.reviewCount,
        p.imageUrl,
        p.stock,
        p.isFeatured ? 1 : 0,
        p.isBestseller ? 1 : 0,
        p.isNewArrival ? 1 : 0,
        p.isFlashSale ? 1 : 0,
        p.badgeText,
        now
      );
    }
  }

  const sectionCount = db.prepare('SELECT COUNT(*) as count FROM sections').get() as { count: number };
  if (sectionCount.count === 0 || seedRevision !== TARGET_SEED_REVISION) {
    seedAllDefaultSections();
  }

  if (seedRevision !== TARGET_SEED_REVISION) {
    db.prepare('INSERT OR REPLACE INTO store_settings (id, value_json, updated_at) VALUES (?, ?, ?)').run(
      'seed_revision',
      JSON.stringify(TARGET_SEED_REVISION),
      now
    );
  }

  const reviewCount = db.prepare('SELECT COUNT(*) as count FROM reviews').get() as { count: number };
  if (reviewCount.count === 0 || seedRevision !== TARGET_SEED_REVISION) {
    const insertReview = db.prepare(`
      INSERT OR REPLACE INTO reviews (id, author_name, author_email, author_role, avatar_url, rating, product_name, quote, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of DEFAULT_REVIEWS) {
      insertReview.run(
        r.id,
        r.authorName,
        '',
        r.authorRole,
        r.avatarUrl,
        r.rating,
        r.productName,
        r.quote,
        now
      );
    }
  }

  const paymentRow = db.prepare('SELECT value_json FROM store_settings WHERE id = ?').get('payment') as
    | { value_json: string }
    | undefined;
  if (!paymentRow) {
    db.prepare('INSERT INTO store_settings (id, value_json, updated_at) VALUES (?, ?, ?)').run(
      'payment',
      JSON.stringify(DEFAULT_PAYMENT_SETTINGS),
      now
    );
  } else {
    // Remove earlier placeholder sample numbers if present so owner supplies real account details
    try {
      const parsed = JSON.parse(paymentRow.value_json) as Record<string, unknown>;
      if (parsed.bankAccountNumber === '0214-0105892341' || parsed.bankIban === 'PK42MEZN0002140105892341') {
        db.prepare('UPDATE store_settings SET value_json = ?, updated_at = ? WHERE id = ?').run(
          JSON.stringify(DEFAULT_PAYMENT_SETTINGS),
          now,
          'payment'
        );
      }
    } catch {
      // Ignore parse issue
    }
  }

  const seoRow = db.prepare('SELECT id FROM store_settings WHERE id = ?').get('seo');
  if (!seoRow) {
    db.prepare('INSERT INTO store_settings (id, value_json, updated_at) VALUES (?, ?, ?)').run(
      'seo',
      JSON.stringify(DEFAULT_SEO_SETTINGS),
      now
    );
  }
}

export function seedAllDefaultSections() {
  const now = new Date().toISOString();
  const defaults = buildDefaultSections();
  const upsert = db.prepare(`
    INSERT OR REPLACE INTO sections (id, type, label, enabled, sort_order, config_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const s of defaults) {
    upsert.run(
      s.id,
      s.type,
      s.label,
      s.enabled ? 1 : 0,
      s.sortOrder,
      JSON.stringify(s.config),
      now
    );
  }
}

export function getPaymentSettings(): PaymentSettings {
  const row = db.prepare('SELECT value_json FROM store_settings WHERE id = ?').get('payment') as
    | { value_json: string }
    | undefined;
  const base = row ? { ...DEFAULT_PAYMENT_SETTINGS, ...JSON.parse(row.value_json) } : DEFAULT_PAYMENT_SETTINGS;
  const jazzcashGatewayConfigured = Boolean(
    process.env.JAZZCASH_MERCHANT_ID?.trim() &&
      process.env.JAZZCASH_PASSWORD?.trim() &&
      process.env.JAZZCASH_INTEGRITY_SALT?.trim()
  );
  return { ...base, jazzcashGatewayConfigured };
}

export function savePaymentSettings(settings: PaymentSettings): PaymentSettings {
  const now = new Date().toISOString();
  const { jazzcashGatewayConfigured: _ignored, ...persisted } = settings;
  db.prepare('INSERT OR REPLACE INTO store_settings (id, value_json, updated_at) VALUES (?, ?, ?)').run(
    'payment',
    JSON.stringify(persisted),
    now
  );
  return getPaymentSettings();
}

export function getSeoSettings(): SeoSettings {
  const row = db.prepare('SELECT value_json FROM store_settings WHERE id = ?').get('seo') as
    | { value_json: string }
    | undefined;
  return row ? { ...DEFAULT_SEO_SETTINGS, ...JSON.parse(row.value_json) } : DEFAULT_SEO_SETTINGS;
}

export function saveSeoSettings(settings: SeoSettings): SeoSettings {
  const now = new Date().toISOString();
  db.prepare('INSERT OR REPLACE INTO store_settings (id, value_json, updated_at) VALUES (?, ?, ?)').run(
    'seo',
    JSON.stringify(settings),
    now
  );
  return settings;
}

function mapProductRow(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    category: row.category as Product['category'],
    collectionTag: String(row.collection_tag),
    description: String(row.description),
    ingredients: String(row.ingredients),
    price: Number(row.price),
    originalPrice: row.original_price === null ? null : Number(row.original_price),
    discountPercent: Number(row.discount_percent),
    rating: Number(row.rating),
    reviewCount: Number(row.review_count),
    imageUrl: String(row.image_url),
    stock: Number(row.stock),
    isFeatured: Number(row.is_featured) === 1,
    isBestseller: Number(row.is_bestseller) === 1,
    isNewArrival: Number(row.is_new_arrival) === 1,
    isFlashSale: Number(row.is_flash_sale) === 1,
    badgeText: String(row.badge_text || ''),
    createdAt: String(row.created_at),
  };
}

export function getAllProducts(): Product[] {
  const rows = db.prepare('SELECT * FROM products ORDER BY created_at ASC, id ASC').all() as Record<string, unknown>[];
  const seenSlugs = new Set<string>();
  const unique: Product[] = [];
  for (const row of rows) {
    const product = mapProductRow(row);
    const key = product.slug.toLowerCase();
    if (!seenSlugs.has(key)) {
      seenSlugs.add(key);
      unique.push(product);
    }
  }
  return unique;
}

export function getProductById(id: string): Product | null {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? mapProductRow(row) : null;
}

export function getProductBySlug(slug: string): Product | null {
  const row = db
    .prepare('SELECT * FROM products WHERE LOWER(slug) = LOWER(?)')
    .get(slug) as Record<string, unknown> | undefined;
  return row ? mapProductRow(row) : null;
}

export function upsertProduct(product: Omit<Product, 'createdAt'> & { createdAt?: string }): Product {
  const now = product.createdAt || new Date().toISOString();
  db.prepare(`
    INSERT OR REPLACE INTO products (
      id, name, slug, category, collection_tag, description, ingredients,
      price, original_price, discount_percent, rating, review_count,
      image_url, stock, is_featured, is_bestseller, is_new_arrival,
      is_flash_sale, badge_text, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    product.id,
    product.name,
    product.slug,
    product.category,
    product.collectionTag,
    product.description,
    product.ingredients,
    product.price,
    product.originalPrice,
    product.discountPercent,
    product.rating,
    product.reviewCount,
    product.imageUrl,
    product.stock,
    product.isFeatured ? 1 : 0,
    product.isBestseller ? 1 : 0,
    product.isNewArrival ? 1 : 0,
    product.isFlashSale ? 1 : 0,
    product.badgeText,
    now
  );
  return getProductById(product.id)!;
}

export function deleteProductById(id: string): boolean {
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getAllSections(): StoreSection[] {
  const rows = db.prepare('SELECT * FROM sections ORDER BY sort_order ASC').all() as Record<string, unknown>[];
  return rows.map((row) => ({
    id: String(row.id) as SectionId,
    type: String(row.type) as SectionId,
    label: String(row.label),
    enabled: Number(row.enabled) === 1,
    sortOrder: Number(row.sort_order),
    config: JSON.parse(String(row.config_json)),
    updatedAt: String(row.updated_at),
  }));
}

export function updateSection(
  id: SectionId,
  updates: { enabled?: boolean; label?: string; config?: Record<string, unknown> }
): StoreSection | null {
  const existing = db.prepare('SELECT * FROM sections WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) return null;

  const now = new Date().toISOString();
  const nextEnabled = updates.enabled !== undefined ? (updates.enabled ? 1 : 0) : Number(existing.enabled);
  const nextLabel = updates.label !== undefined ? updates.label : String(existing.label);
  const nextConfig =
    updates.config !== undefined ? JSON.stringify(updates.config) : String(existing.config_json);

  db.prepare(`
    UPDATE sections SET enabled = ?, label = ?, config_json = ?, updated_at = ? WHERE id = ?
  `).run(nextEnabled, nextLabel, nextConfig, now, id);

  const row = db.prepare('SELECT * FROM sections WHERE id = ?').get(id) as Record<string, unknown>;
  return {
    id: String(row.id) as SectionId,
    type: String(row.type) as SectionId,
    label: String(row.label),
    enabled: Number(row.enabled) === 1,
    sortOrder: Number(row.sort_order),
    config: JSON.parse(String(row.config_json)),
    updatedAt: String(row.updated_at),
  };
}

export function reorderSections(orderedIds: string[]): StoreSection[] {
  const updateStmt = db.prepare('UPDATE sections SET sort_order = ?, updated_at = ? WHERE id = ?');
  const now = new Date().toISOString();
  db.exec('BEGIN');
  try {
    orderedIds.forEach((id, index) => {
      updateStmt.run(index + 1, now, id);
    });
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return getAllSections();
}

function mapReviewRow(row: Record<string, unknown>): Review {
  return {
    id: String(row.id),
    authorName: String(row.author_name),
    authorEmail: String(row.author_email || ''),
    authorRole: String(row.author_role),
    avatarUrl: String(row.avatar_url),
    rating: Number(row.rating),
    productName: String(row.product_name),
    quote: String(row.quote),
    createdAt: String(row.created_at),
  };
}

export function getAllReviews(): Review[] {
  const rows = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all() as Record<string, unknown>[];
  return rows.map(mapReviewRow);
}

export function getReviewsByEmail(email: string): Review[] {
  const rows = db
    .prepare('SELECT * FROM reviews WHERE LOWER(author_email) = LOWER(?) ORDER BY created_at DESC')
    .all(email) as Record<string, unknown>[];
  return rows.map(mapReviewRow);
}

export function createReview(review: Omit<Review, 'id' | 'createdAt'>): Review {
  const id = `rev-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO reviews (id, author_name, author_email, author_role, avatar_url, rating, product_name, quote, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    review.authorName,
    review.authorEmail || '',
    review.authorRole,
    review.avatarUrl,
    review.rating,
    review.productName,
    review.quote,
    now
  );
  return { id, ...review, createdAt: now };
}

function mapOrderRow(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    customerName: String(row.customer_name),
    customerEmail: String(row.customer_email),
    customerPhone: String(row.customer_phone || ''),
    shippingAddress: String(row.shipping_address),
    postalCode: String(row.postal_code || ''),
    paymentMethod: String(row.payment_method || 'cod') as PaymentMethod,
    paymentReference: String(row.payment_reference || ''),
    paymentStatus: String(row.payment_status || 'Pending Verification'),
    paymentDate: String(row.payment_date || ''),
    receiptFilename: String(row.receipt_filename || ''),
    rejectionReason: String(row.rejection_reason || ''),
    items: JSON.parse(String(row.items_json)),
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.shipping_fee),
    total: Number(row.total),
    status: String(row.status),
    createdAt: String(row.created_at),
  };
}

export function logPaymentTransaction(entry: {
  orderId: string;
  txnRefNo: string;
  paymentMethod: PaymentMethod;
  amount: number;
  currency?: string;
  status: string;
  gatewayCode?: string;
  message: string;
  actor: string;
}): PaymentTransactionLog {
  const id = `txlog-${crypto.randomUUID().slice(0, 10)}`;
  const now = new Date().toISOString();
  const currency = entry.currency || 'USD';
  db.prepare(`
    INSERT INTO payment_transactions (
      id, order_id, txn_ref_no, payment_method, amount, currency, status, gateway_code, message, actor, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    entry.orderId,
    entry.txnRefNo,
    entry.paymentMethod,
    entry.amount,
    currency,
    entry.status,
    entry.gatewayCode || '',
    entry.message,
    entry.actor,
    now
  );
  return {
    id,
    orderId: entry.orderId,
    txnRefNo: entry.txnRefNo,
    paymentMethod: entry.paymentMethod,
    amount: entry.amount,
    currency,
    status: entry.status,
    gatewayCode: entry.gatewayCode || '',
    message: entry.message,
    actor: entry.actor,
    createdAt: now,
  };
}

export function getPaymentTransactionLogs(): PaymentTransactionLog[] {
  const rows = db
    .prepare('SELECT * FROM payment_transactions ORDER BY created_at DESC LIMIT 100')
    .all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: String(r.id),
    orderId: String(r.order_id),
    txnRefNo: String(r.txn_ref_no),
    paymentMethod: String(r.payment_method) as PaymentMethod,
    amount: Number(r.amount),
    currency: String(r.currency),
    status: String(r.status),
    gatewayCode: String(r.gateway_code || ''),
    message: String(r.message || ''),
    actor: String(r.actor || 'system'),
    createdAt: String(r.created_at),
  }));
}

export function hasDuplicateTransactionReference(reference: string): boolean {
  const clean = reference.trim();
  if (!clean) return false;
  const orderMatch = db
    .prepare('SELECT id FROM orders WHERE LOWER(payment_reference) = LOWER(?)')
    .get(clean);
  if (orderMatch) return true;
  const txMatch = db
    .prepare(
      "SELECT id FROM payment_transactions WHERE LOWER(txn_ref_no) = LOWER(?) AND status IN ('Paid', 'Verified Paid', 'Pending Verification')"
    )
    .get(clean);
  return Boolean(txMatch);
}

export function getOrderById(id: string): Order | null {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? mapOrderRow(row) : null;
}

export function createOrder(input: {
  orderId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  postalCode: string;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  paymentDate?: string;
  receiptFilename?: string;
  paymentStatusOverride?: string;
  orderStatusOverride?: string;
  items: Array<{ productId: string; quantity: number }>;
}): Order {
  if (
    input.paymentReference &&
    (input.paymentMethod === 'bank_transfer' || input.paymentMethod === 'jazzcash') &&
    hasDuplicateTransactionReference(input.paymentReference)
  ) {
    throw new Error('This Transaction ID has already been submitted for another order.');
  }

  const verifiedItems: Order['items'] = [];
  let subtotal = 0;

  db.exec('BEGIN');
  try {
    for (const reqItem of input.items) {
      const product = getProductById(reqItem.productId);
      if (!product) {
        throw new Error(`Product not found: ${reqItem.productId}`);
      }
      const qty = Math.max(1, Math.min(20, Math.floor(reqItem.quantity)));
      if (product.stock < qty) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, product.id);
      subtotal += product.price * qty;
      verifiedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: qty,
        imageUrl: product.imageUrl,
      });
    }

    const shippingFee = subtotal >= 150 ? 0 : 18;
    const total = Number((subtotal + shippingFee).toFixed(2));
    const orderNumber = input.orderId || `GLW-${Math.floor(100000 + Math.random() * 899999)}`;
    const now = new Date().toISOString();

    const paymentStatus =
      input.paymentStatusOverride ||
      (input.paymentMethod === 'cod'
        ? 'Cash on Delivery'
        : input.paymentMethod === 'card'
          ? 'Paid via Card'
          : 'Pending Verification');

    const orderStatus =
      input.orderStatusOverride ||
      (input.paymentMethod === 'bank_transfer'
        ? 'Pending Bank Verification'
        : input.paymentMethod === 'jazzcash'
          ? 'Awaiting JazzCash Payment'
          : 'Confirmed — Preparing Shipment');

    db.prepare(`
      INSERT INTO orders (
        id, customer_name, customer_email, customer_phone, shipping_address, postal_code,
        payment_method, payment_reference, payment_status, payment_date, receipt_filename, rejection_reason,
        items_json, subtotal, shipping_fee, total, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderNumber,
      input.customerName,
      input.customerEmail,
      input.customerPhone,
      input.shippingAddress,
      input.postalCode,
      input.paymentMethod,
      input.paymentReference,
      paymentStatus,
      input.paymentDate || now.slice(0, 10),
      input.receiptFilename || '',
      '',
      JSON.stringify(verifiedItems),
      Number(subtotal.toFixed(2)),
      shippingFee,
      total,
      orderStatus,
      now
    );

    db.exec('COMMIT');

    logPaymentTransaction({
      orderId: orderNumber,
      txnRefNo: input.paymentReference || orderNumber,
      paymentMethod: input.paymentMethod,
      amount: total,
      status: paymentStatus,
      message:
        input.paymentMethod === 'bank_transfer'
          ? `Bank transfer receipt & TID submitted (${input.paymentReference})`
          : input.paymentMethod === 'jazzcash'
            ? `JazzCash transaction initiated (${input.paymentReference})`
            : `Order placed with ${input.paymentMethod.toUpperCase()}`,
      actor: input.customerEmail,
    });

    return getOrderById(orderNumber)!;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function restoreOrderStock(order: Order) {
  for (const item of order.items) {
    db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.productId);
  }
}

export function finalizeJazzCashOrder(input: {
  orderId: string;
  txnRefNo: string;
  success: boolean;
  cancelled?: boolean;
  gatewayCode: string;
  message: string;
}): Order | null {
  const existing = getOrderById(input.orderId);
  if (!existing) return null;

  // Idempotency guard: do not re-process already finalized paid orders
  if (existing.paymentStatus === 'Paid' || existing.paymentStatus === 'Verified Paid') {
    return existing;
  }

  const nextPaymentStatus = input.success
    ? 'Paid'
    : input.cancelled
      ? 'Cancelled'
      : 'Failed';
  const nextOrderStatus = input.success
    ? 'Confirmed — Preparing Shipment'
    : input.cancelled
      ? 'Cancelled by Customer'
      : 'Payment Failed';

  db.exec('BEGIN');
  try {
    if (!input.success && existing.paymentStatus === 'Initiated') {
      restoreOrderStock(existing);
    }
    db.prepare(
      'UPDATE orders SET payment_reference = ?, payment_status = ?, status = ? WHERE id = ?'
    ).run(input.txnRefNo, nextPaymentStatus, nextOrderStatus, existing.id);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  logPaymentTransaction({
    orderId: existing.id,
    txnRefNo: input.txnRefNo,
    paymentMethod: 'jazzcash',
    amount: existing.total,
    status: nextPaymentStatus,
    gatewayCode: input.gatewayCode,
    message: input.message,
    actor: 'jazzcash-gateway',
  });

  return getOrderById(existing.id);
}

export function approveOrderPayment(orderId: string): Order | null {
  const existing = getOrderById(orderId);
  if (!existing) return null;

  db.prepare(
    'UPDATE orders SET payment_status = ?, status = ?, rejection_reason = ? WHERE id = ?'
  ).run('Verified Paid', 'Confirmed — Preparing Shipment', '', orderId);

  logPaymentTransaction({
    orderId,
    txnRefNo: existing.paymentReference || orderId,
    paymentMethod: existing.paymentMethod,
    amount: existing.total,
    status: 'Verified Paid',
    message: 'Payment approved by administrator after receipt/TID verification.',
    actor: 'admin',
  });

  return getOrderById(orderId);
}

export function rejectOrderPayment(orderId: string, reason: string): Order | null {
  const existing = getOrderById(orderId);
  if (!existing) return null;

  db.exec('BEGIN');
  try {
    if (existing.paymentStatus !== 'Rejected' && existing.paymentStatus !== 'Failed' && existing.paymentStatus !== 'Cancelled') {
      restoreOrderStock(existing);
    }
    db.prepare(
      'UPDATE orders SET payment_status = ?, status = ?, rejection_reason = ? WHERE id = ?'
    ).run('Rejected', 'Payment Rejected', reason, orderId);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  logPaymentTransaction({
    orderId,
    txnRefNo: existing.paymentReference || orderId,
    paymentMethod: existing.paymentMethod,
    amount: existing.total,
    status: 'Rejected',
    message: `Payment rejected by admin: ${reason}`,
    actor: 'admin',
  });

  return getOrderById(orderId);
}

export function getOrdersByEmail(email: string): Order[] {
  const rows = db
    .prepare('SELECT * FROM orders WHERE LOWER(customer_email) = LOWER(?) ORDER BY created_at DESC')
    .all(email) as Record<string, unknown>[];
  return rows.map(mapOrderRow);
}

export function getAllOrders(): Order[] {
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100').all() as Record<string, unknown>[];
  return rows.map(mapOrderRow);
}

export function updateOrderStatus(
  id: string,
  updates: { status?: string; paymentStatus?: string }
): Order | null {
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) return null;
  const nextStatus = updates.status ?? String(existing.status);
  const nextPayStatus = updates.paymentStatus ?? String(existing.payment_status);
  db.prepare('UPDATE orders SET status = ?, payment_status = ? WHERE id = ?').run(
    nextStatus,
    nextPayStatus,
    id
  );
  return getOrderById(id);
}

export function subscribeNewsletter(email: string): { subscribed: boolean; alreadySubscribed: boolean } {
  const existing = db
    .prepare('SELECT id FROM newsletter_subscribers WHERE LOWER(email) = LOWER(?)')
    .get(email) as { id: string } | undefined;
  if (existing) {
    return { subscribed: true, alreadySubscribed: true };
  }
  const id = `sub-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  db.prepare('INSERT INTO newsletter_subscribers (id, email, created_at) VALUES (?, ?, ?)').run(id, email, now);
  return { subscribed: true, alreadySubscribed: false };
}

export function getAdminCredential(): { passcodeHash: string; salt: string } | null {
  const row = db.prepare('SELECT passcode_hash, salt FROM admin_config WHERE id = ?').get('primary') as
    | { passcode_hash: string; salt: string }
    | undefined;
  return row ? { passcodeHash: row.passcode_hash, salt: row.salt } : null;
}

export function claimAdminPasscodeOnce(passcode: string): boolean {
  const existing = getAdminCredential();
  if (existing) return false;
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(passcode, salt, 64).toString('hex');
  const now = new Date().toISOString();
  const result = db
    .prepare('INSERT OR IGNORE INTO admin_config (id, passcode_hash, salt, updated_at) VALUES (?, ?, ?, ?)')
    .run('primary', hash, salt, now);
  return result.changes > 0;
}

export function verifyStoredAdminPasscode(passcode: string): boolean {
  const cred = getAdminCredential();
  if (!cred) return false;
  const candidate = crypto.scryptSync(passcode, cred.salt, 64);
  const stored = Buffer.from(cred.passcodeHash, 'hex');
  if (candidate.length !== stored.length) return false;
  return crypto.timingSafeEqual(candidate, stored);
}
