import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  FileCheck2,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Trash2,
  Truck,
  UploadCloud,
  X,
} from 'lucide-react';
import type { CartItem, Order, PaymentMethod, PaymentSettings } from '../../types/glowora';
import { JazzCashLogo } from '../ui/JazzCashLogo';
import { LuxuryImage } from '../ui/LuxuryImage';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  paymentSettings: PaymentSettings;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onPlaceOrder: (payload: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    postalCode: string;
    paymentMethod: PaymentMethod;
    paymentReference: string;
  }) => Promise<Order>;
  onOrderCompleted: (order: Order) => Promise<void>;
}

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  jazzcash: 'JazzCash Merchant Gateway',
  bank_transfer: 'Bank Account Transfer',
  cod: 'Cash on Delivery (COD)',
  card: 'Credit / Debit Card',
};

function generateDraftOrderNumber(): string {
  return `GLW-${Math.floor(100000 + Math.random() * 899999)}`;
}

function getPaymentBadgeClasses(status: string): string {
  if (status === 'Paid' || status === 'Verified Paid' || status === 'Paid via Card') {
    return 'border-emerald-500/40 bg-emerald-950/50 text-emerald-300';
  }
  if (status === 'Pending Verification' || status === 'Initiated') {
    return 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#E5C158]';
  }
  if (status === 'Rejected' || status === 'Failed' || status === 'Cancelled') {
    return 'border-red-500/40 bg-red-950/40 text-red-300';
  }
  return 'border-white/20 bg-white/5 text-[#D6D3CD]';
}

export function CartDrawer({
  open,
  onClose,
  items,
  paymentSettings,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  onOrderCompleted,
}: CartDrawerProps) {
  const [step, setStep] = useState<'bag' | 'checkout' | 'confirmed'>('bag');
  const [draftOrderId, setDraftOrderId] = useState<string>(() => generateDraftOrderNumber());

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() =>
    paymentSettings.jazzcashEnabled
      ? 'jazzcash'
      : paymentSettings.bankEnabled
        ? 'bank_transfer'
        : paymentSettings.codEnabled
          ? 'cod'
          : 'card'
  );

  // Separate modals for JazzCash & Bank Transfer
  const [activeGatewayModal, setActiveGatewayModal] = useState<'jazzcash' | 'bank_transfer' | null>(null);

  // JazzCash state (never MPIN / PIN / OTP)
  const [jazzcashMobile, setJazzcashMobile] = useState('');

  // Bank Transfer state
  const [bankReference, setBankReference] = useState('');
  const [bankPaymentDate, setBankPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [receiptFilename, setReceiptFilename] = useState('');
  const [receiptLabel, setReceiptLabel] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [copiedField, setCopiedField] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (open && step === 'bag') {
      setDraftOrderId(generateDraftOrderNumber());
    }
  }, [open, step]);

  if (!open) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const freeShippingThreshold = 150;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 18;
  const total = Number((subtotal + shippingFee).toFixed(2));

  const bankConfigured = Boolean(
    paymentSettings.bankName.trim() && paymentSettings.bankAccountNumber.trim()
  );

  const handleCopy = (label: string, val: string) => {
    if (!val) return;
    navigator.clipboard?.writeText(val);
    setCopiedField(label);
    setTimeout(() => setCopiedField(''), 1600);
  };

  const validateShippingFields = (): string | null => {
    if (customerName.trim().length < 2) return 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      return 'Please enter a valid email address.';
    }
    if (customerPhone.trim().length < 7) return 'Please enter a valid contact phone number.';
    if (shippingAddress.trim().length < 6) return 'Please enter your complete shipping address.';
    return null;
  };

  const resetFormAfterOrder = (order: Order) => {
    setConfirmedOrder(order);
    setActiveGatewayModal(null);
    setStep('confirmed');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setShippingAddress('');
    setPostalCode('');
    setJazzcashMobile('');
    setBankReference('');
    setReceiptFilename('');
    setReceiptLabel('');
    setDraftOrderId(generateDraftOrderNumber());
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setModalError('');

    const shippingErr = validateShippingFields();
    if (shippingErr) {
      setError(shippingErr);
      return;
    }

    if (paymentMethod === 'jazzcash') {
      setActiveGatewayModal('jazzcash');
      return;
    }

    if (paymentMethod === 'bank_transfer') {
      setActiveGatewayModal('bank_transfer');
      return;
    }

    setSubmitting(true);
    try {
      const order = await onPlaceOrder({
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        postalCode,
        paymentMethod,
        paymentReference: '',
      });
      resetFormAfterOrder(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJazzCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    const cleanMobile = jazzcashMobile.replace(/[\s-]/g, '').trim();
    if (!/^03\d{9}$/.test(cleanMobile)) {
      setModalError('Enter a valid 11-digit JazzCash mobile number (03XXXXXXXXX).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payments/jazzcash/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: draftOrderId,
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          postalCode,
          jazzcashMobile: cleanMobile,
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (data.mode === 'redirect' && data.gatewayUrl && data.formFields) {
        // Redirect cleanly to official JazzCash Hosted Merchant Payment Page
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.gatewayUrl;
        Object.entries(data.formFields as Record<string, string>).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }

      if (!res.ok || !data.success) {
        setDraftOrderId(generateDraftOrderNumber());
        throw new Error(
          data.gatewayMessage ||
            data.error ||
            'JazzCash payment was not completed. Please verify your wallet and retry.'
        );
      }

      await onOrderCompleted(data.order);
      resetFormAfterOrder(data.order);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'JazzCash payment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiptUpload = async (file: File) => {
    setModalError('');
    const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'application/pdf']);
    if (!allowedTypes.has(file.type)) {
      setModalError('Please upload a PNG, JPG, WEBP screenshot or PDF receipt.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setModalError('Receipt file must be under 5 MB.');
      return;
    }

    setUploadingReceipt(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read receipt file.'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/payments/bank/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mimeType: file.type,
          dataBase64: dataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload receipt.');
      setReceiptFilename(data.filename);
      setReceiptLabel(`${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Receipt upload failed.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleBankTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!receiptFilename) {
      setModalError('Please upload your bank transfer payment receipt screenshot or PDF.');
      return;
    }
    if (bankReference.trim().length < 4) {
      setModalError('Please enter your Bank Transaction ID (TID / IBFT reference).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payments/bank/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: draftOrderId,
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          postalCode,
          paymentReference: bankReference.trim(),
          paymentDate: bankPaymentDate,
          receiptFilename,
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          throw new Error(data.error || 'Duplicate Transaction ID detected.');
        }
        throw new Error(data.error || 'Unable to submit bank transfer details.');
      }

      await onOrderCompleted(data.order);
      resetFormAfterOrder(data.order);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setActiveGatewayModal(null);
    if (step === 'confirmed') setStep('bag');
    onClose();
  };

  const availableMethods: Array<{
    id: PaymentMethod;
    enabled: boolean;
    title: string;
    subtitle: string;
    badge?: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'jazzcash',
      enabled: paymentSettings.jazzcashEnabled,
      title: 'JazzCash',
      subtitle: 'Official Merchant Gateway',
      badge: paymentSettings.jazzcashGatewayConfigured ? 'Live' : 'Preview',
      icon: <JazzCashLogo compact />,
    },
    {
      id: 'bank_transfer',
      enabled: paymentSettings.bankEnabled,
      title: 'Bank Transfer',
      subtitle: 'IBFT / Raast + Receipt',
      badge: 'Verified',
      icon: (
        <div className="flex h-7 w-7 items-center justify-center border border-[#D4AF37]/40 bg-[#1B1B20] text-[#D4AF37]">
          <Building2 className="h-4 w-4" />
        </div>
      ),
    },
    {
      id: 'cod',
      enabled: paymentSettings.codEnabled,
      title: 'Cash on Delivery',
      subtitle: 'Pay upon parcel arrival',
      icon: <Truck className="h-4 w-4 text-[#D4AF37]" />,
    },
    {
      id: 'card',
      enabled: paymentSettings.cardEnabled,
      title: 'Card Payment',
      subtitle: 'Visa / Mastercard / Amex',
      icon: <CreditCard className="h-4 w-4 text-[#D4AF37]" />,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
    >
      <div className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0E0E10] text-[#F5F2EB]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-4.5 w-4.5 text-[#D4AF37]" />
            <h2 className="font-display text-2xl font-semibold">
              {step === 'bag'
                ? 'Shopping Bag'
                : step === 'checkout'
                  ? 'Checkout & Payment'
                  : 'Order Summary'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close bag"
            className="flex h-9 w-9 items-center justify-center text-[#A8A29E] hover:text-[#F5F2EB]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 'confirmed' && confirmedOrder ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="border border-[#D4AF37]/40 bg-[#141417] p-6 space-y-3 text-center">
              {confirmedOrder.paymentStatus === 'Pending Verification' ? (
                <Clock className="h-8 w-8 text-[#D4AF37] mx-auto" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
              )}
              <p className="font-mono-tabular text-xs uppercase tracking-widest text-[#D4AF37]">
                Order #{confirmedOrder.id}
              </p>
              <h3 className="font-display text-2xl text-[#F5F2EB]">{confirmedOrder.status}</h3>
              <span
                className={`inline-block border px-3 py-1 text-[11px] font-medium ${getPaymentBadgeClasses(
                  confirmedOrder.paymentStatus
                )}`}
              >
                {confirmedOrder.paymentStatus}
              </span>
              <p className="text-xs text-[#A8A29E]">
                {confirmedOrder.paymentMethod === 'bank_transfer'
                  ? 'Your receipt and Transaction ID have been received and sent to our verification team. Orders dispatch promptly once confirmed.'
                  : `Confirmation details have been logged for ${confirmedOrder.customerEmail}.`}
              </p>
            </div>

            <div className="border border-white/10 bg-[#141417] p-5 space-y-3 text-sm">
              <div className="flex justify-between text-xs text-[#A8A29E]">
                <span>Recipient</span>
                <span className="text-[#F5F2EB]">{confirmedOrder.customerName}</span>
              </div>
              <div className="flex justify-between text-xs text-[#A8A29E]">
                <span>Payment Method</span>
                <span className="text-[#D4AF37]">
                  {PAYMENT_LABEL[confirmedOrder.paymentMethod] || confirmedOrder.paymentMethod}
                </span>
              </div>
              {confirmedOrder.paymentReference && (
                <div className="flex justify-between text-xs text-[#A8A29E]">
                  <span>Transaction Reference</span>
                  <span className="font-mono-tabular text-[#F5F2EB]">
                    {confirmedOrder.paymentReference}
                  </span>
                </div>
              )}
              {confirmedOrder.paymentDate && (
                <div className="flex justify-between text-xs text-[#A8A29E]">
                  <span>Payment Date</span>
                  <span className="font-mono-tabular text-[#F5F2EB]">
                    {confirmedOrder.paymentDate}
                  </span>
                </div>
              )}
              <div className="border-t border-white/10 pt-3 space-y-2">
                {confirmedOrder.items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-xs">
                    <span className="text-[#D6D3CD]">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-mono-tabular text-[#F5F2EB]">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between font-semibold">
                <span>Total Amount</span>
                <span className="font-mono-tabular text-[#D4AF37]">
                  ${confirmedOrder.total.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full bg-[#D4AF37] py-3 text-xs font-semibold tracking-wider uppercase text-[#0A0A0B] hover:bg-[#E5C158]"
            >
              Continue Exploring
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <ShoppingBag className="h-10 w-10 text-[#3F3F46]" strokeWidth={1.25} />
            <p className="font-display text-2xl text-[#F5F2EB]">Your bag is empty</p>
            <p className="text-sm text-[#A8A29E] max-w-xs">
              Explore our botanical skincare, velvet matte lipsticks, and fine fragrances.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="bg-[#D4AF37] px-6 py-3 text-xs font-semibold tracking-wider uppercase text-[#0A0A0B] hover:bg-[#E5C158]"
            >
              Browse Shop
            </button>
          </div>
        ) : (
          <>
            <div className="border-b border-white/10 bg-[#141417] px-6 py-3">
              <p className="text-xs text-[#D6D3CD] mb-2">
                {remainingForFreeShipping === 0
                  ? 'Complimentary express international shipping unlocked'
                  : `Add $${remainingForFreeShipping.toFixed(0)} more for complimentary express shipping`}
              </p>
              <div className="h-1 w-full bg-[#27272D] overflow-hidden">
                <div
                  className="h-full bg-[#D4AF37] transition-all duration-300"
                  style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {step === 'bag' ? (
                <div className="divide-y divide-white/10">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="py-4 first:pt-0 flex gap-4">
                      <div className="h-20 w-24 shrink-0 overflow-hidden bg-[#141417] border border-white/10">
                        <LuxuryImage
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[11px] text-[#A8A29E]">{product.category}</p>
                            <h3 className="font-display text-lg font-medium text-[#F5F2EB] truncate">
                              {product.name}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(product.id)}
                            aria-label={`Remove ${product.name}`}
                            className="text-[#78716C] hover:text-red-400 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="inline-flex items-center border border-white/15 bg-[#141417]">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(product.id, -1)}
                              aria-label="Decrease quantity"
                              className="p-1.5 text-[#A8A29E] hover:text-[#F5F2EB]"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="font-mono-tabular px-3 text-xs text-[#F5F2EB]">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(product.id, 1)}
                              aria-label="Increase quantity"
                              className="p-1.5 text-[#A8A29E] hover:text-[#F5F2EB]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <span className="font-mono-tabular text-sm font-semibold text-[#D4AF37]">
                            ${(product.price * quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <form id="glowora-checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
                  <div className="flex items-center justify-between border border-white/10 bg-[#141417] px-3.5 py-2 text-xs">
                    <span className="text-[#A8A29E]">Order Reference</span>
                    <span className="font-mono-tabular font-semibold text-[#D4AF37]">
                      #{draftOrderId}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#A8A29E] mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Camille Laurent"
                        className="w-full border border-white/15 bg-[#141417] px-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#A8A29E] mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+92 300 1234567"
                        className="w-full border border-white/15 bg-[#141417] px-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#A8A29E] mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full border border-white/15 bg-[#141417] px-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs text-[#A8A29E] mb-1">Shipping Address</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Street, Area & City"
                        className="w-full border border-white/15 bg-[#141417] px-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#A8A29E] mb-1">Postal Code</label>
                      <input
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="54000"
                        className="w-full border border-white/15 bg-[#141417] px-3 py-2 text-xs text-[#F5F2EB] font-mono-tabular focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Separate Payment Selection Cards */}
                  <div className="pt-2 space-y-2.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                      Select Payment Method
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {availableMethods
                        .filter((m) => m.enabled)
                        .map((method) => {
                          const selected = paymentMethod === method.id;
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => {
                                setPaymentMethod(method.id);
                                setError('');
                                setModalError('');
                              }}
                              className={`flex items-start gap-2.5 border p-3 text-left transition-colors ${
                                selected
                                  ? 'border-[#D4AF37] bg-[#1C1C21]'
                                  : 'border-white/10 bg-[#141417] hover:border-white/25'
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">{method.icon}</div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <p className="text-xs font-semibold text-[#F5F2EB]">
                                    {method.title}
                                  </p>
                                  {method.badge && (
                                    <span className="border border-[#D4AF37]/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[#D4AF37]">
                                      {method.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#A8A29E] leading-tight mt-0.5">
                                  {method.subtitle}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Selected Payment Method Preview */}
                  {paymentMethod === 'jazzcash' && (
                    <div className="border border-[#D4AF37]/40 bg-[#141417] p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37]">
                          <Smartphone className="h-3.5 w-3.5" />
                          JazzCash Official Gateway
                        </span>
                        <span className="font-mono-tabular text-xs font-semibold text-[#F5F2EB]">
                          ${total.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A8A29E] leading-relaxed">
                        {paymentSettings.jazzcashInstructions}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const shippingErr = validateShippingFields();
                          if (shippingErr) {
                            setError(shippingErr);
                            return;
                          }
                          setError('');
                          setModalError('');
                          setActiveGatewayModal('jazzcash');
                        }}
                        className="w-full border border-[#D4AF37]/60 bg-[#0A0A0B] py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0B] transition-colors"
                      >
                        Open JazzCash Payment Window
                      </button>
                    </div>
                  )}

                  {paymentMethod === 'bank_transfer' && (
                    <div className="border border-[#D4AF37]/40 bg-[#141417] p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37]">
                          <Building2 className="h-3.5 w-3.5" />
                          Bank Account Transfer
                        </span>
                        <span className="font-mono-tabular text-xs font-semibold text-[#F5F2EB]">
                          ${total.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A8A29E] leading-relaxed">
                        View GLOWORA bank account details, upload your payment receipt, and submit your Transaction ID for admin verification.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const shippingErr = validateShippingFields();
                          if (shippingErr) {
                            setError(shippingErr);
                            return;
                          }
                          setError('');
                          setModalError('');
                          setActiveGatewayModal('bank_transfer');
                        }}
                        className="w-full border border-[#D4AF37]/60 bg-[#0A0A0B] py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0B] transition-colors"
                      >
                        Open Bank Transfer Panel
                      </button>
                    </div>
                  )}

                  {paymentMethod === 'cod' && (
                    <div className="border border-white/10 bg-[#141417] p-3.5 text-xs text-[#A8A29E]">
                      Pay <strong className="font-mono-tabular text-[#D4AF37]">${total.toFixed(2)}</strong>{' '}
                      in cash to the courier upon delivery. Orders over $150 ship free.
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="border border-white/10 bg-[#141417] p-3.5 text-xs text-[#A8A29E]">
                      Card authorization will be processed securely for{' '}
                      <strong className="font-mono-tabular text-[#D4AF37]">${total.toFixed(2)}</strong>.
                    </div>
                  )}

                  {error && (
                    <p className="flex items-center gap-1.5 text-xs text-red-400">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{error}</span>
                    </p>
                  )}
                </form>
              )}
            </div>

            <div className="border-t border-white/10 bg-[#141417] p-6 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#A8A29E]">
                  <span>Subtotal</span>
                  <span className="font-mono-tabular text-[#F5F2EB]">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#A8A29E]">
                  <span>Express Courier</span>
                  <span className="font-mono-tabular text-[#F5F2EB]">
                    {shippingFee === 0 ? 'Complimentary' : `$${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-semibold">
                  <span>Total</span>
                  <span className="font-mono-tabular text-[#D4AF37]">${total.toFixed(2)}</span>
                </div>
              </div>

              {step === 'bag' ? (
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full bg-[#D4AF37] py-3.5 text-xs font-semibold tracking-[0.14em] uppercase text-[#0A0A0B] hover:bg-[#E5C158] transition-colors"
                >
                  Proceed to Checkout
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('bag')}
                    className="border border-white/15 px-4 py-3 text-xs text-[#A8A29E] hover:text-[#F5F2EB]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    form="glowora-checkout-form"
                    disabled={submitting}
                    className="flex-1 bg-[#D4AF37] py-3 text-xs font-semibold tracking-[0.14em] uppercase text-[#0A0A0B] hover:bg-[#E5C158] disabled:opacity-50"
                  >
                    {paymentMethod === 'jazzcash'
                      ? 'Continue to JazzCash'
                      : paymentMethod === 'bank_transfer'
                        ? 'Open Bank Transfer'
                        : submitting
                          ? 'Confirming Order...'
                          : `Place Order · $${total.toFixed(2)}`}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Dedicated JazzCash Official Merchant Gateway Modal */}
      {activeGatewayModal === 'jazzcash' && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
          role="dialog"
          aria-modal="true"
          aria-label="JazzCash Merchant Payment"
        >
          <div className="w-full max-w-md border border-[#D4AF37]/40 bg-[#0E0E10] text-[#F5F2EB] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#141417] px-6 py-4">
              <div className="flex items-center gap-3">
                <JazzCashLogo compact />
                <div>
                  <h3 className="font-display text-xl font-semibold leading-tight">
                    JazzCash Merchant Checkout
                  </h3>
                  <p className="text-[11px] text-[#A8A29E]">
                    {paymentSettings.jazzcashDisplayName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveGatewayModal(null)}
                aria-label="Close JazzCash modal"
                className="text-[#A8A29E] hover:text-[#F5F2EB]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleJazzCashSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 border border-white/10 bg-[#141417] p-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#A8A29E]">Order Number</p>
                  <p className="font-mono-tabular text-sm font-semibold text-[#D4AF37] mt-0.5">
                    #{draftOrderId}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-[#A8A29E]">Payment Amount</p>
                  <p className="font-mono-tabular text-sm font-semibold text-[#F5F2EB] mt-0.5">
                    ${total.toFixed(2)}
                  </p>
                </div>
              </div>

              {!paymentSettings.jazzcashGatewayConfigured && (
                <div className="border border-amber-500/40 bg-amber-950/30 p-3.5 text-xs text-amber-200 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Preview Mode · Merchant Credentials Optional
                  </p>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    JazzCash merchant secrets (`JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_INTEGRITY_SALT`) are optional during preview. Add them to server environment variables when ready to process live verified transactions — GLOWORA never simulates fake confirmations.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs text-[#D4AF37] mb-1.5 font-medium">
                  JazzCash Mobile Account Number
                </label>
                <input
                  type="tel"
                  required
                  value={jazzcashMobile}
                  onChange={(e) => setJazzcashMobile(e.target.value)}
                  placeholder="03001234567"
                  className="w-full border border-white/15 bg-[#141417] px-3.5 py-2.5 text-sm font-mono-tabular text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
                />
                <p className="mt-1.5 text-[11px] text-[#A8A29E]">
                  Enter your 11-digit JazzCash wallet number. Official payment authorization happens via JazzCash Gateway.
                </p>
              </div>

              <div className="flex items-start gap-2 border border-white/10 bg-[#141417] p-3 text-[11px] text-[#A8A29E]">
                <Lock className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>
                  Security Guarantee: GLOWORA never asks for, transmits, or stores your JazzCash MPIN, PIN, or OTP.
                </span>
              </div>

              {modalError && (
                <div className="border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveGatewayModal(null)}
                  className="border border-white/15 px-4 py-2.5 text-xs text-[#A8A29E] hover:text-[#F5F2EB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#D4AF37] py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0A0A0B] hover:bg-[#E5C158] disabled:opacity-50"
                >
                  {submitting ? 'Connecting Gateway...' : `Pay $${total.toFixed(2)} via JazzCash`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Bank Account Transfer Modal */}
      {activeGatewayModal === 'bank_transfer' && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
          role="dialog"
          aria-modal="true"
          aria-label="Bank Account Transfer Details"
        >
          <div className="w-full max-w-lg border border-[#D4AF37]/40 bg-[#0E0E10] text-[#F5F2EB] shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#141417] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center border border-[#D4AF37]/40 bg-[#0A0A0B] text-[#D4AF37]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold leading-tight">
                    Bank Transfer Instructions
                  </h3>
                  <p className="text-[11px] text-[#A8A29E]">
                    Order Reference <span className="font-mono-tabular text-[#D4AF37]">#{draftOrderId}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveGatewayModal(null)}
                aria-label="Close bank transfer modal"
                className="text-[#A8A29E] hover:text-[#F5F2EB]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBankTransferSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 border border-white/10 bg-[#141417] p-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#A8A29E]">Order Reference</p>
                  <p className="font-mono-tabular text-sm font-semibold text-[#D4AF37] mt-0.5">
                    #{draftOrderId}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-[#A8A29E]">Amount Due</p>
                  <p className="font-mono-tabular text-sm font-semibold text-[#F5F2EB] mt-0.5">
                    ${total.toFixed(2)}
                  </p>
                </div>
              </div>

              {!bankConfigured ? (
                <div className="border border-amber-500/40 bg-amber-950/30 p-4 text-xs text-amber-200 space-y-1.5">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Bank Account Not Yet Configured
                  </p>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    The store owner must enter the official Bank Name, Account Title, Account Number, and IBAN in Admin Builder → Settings before customers can submit bank transfers.
                  </p>
                </div>
              ) : (
                <div className="border border-[#D4AF37]/30 bg-[#141417] p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                    <span className="text-[#A8A29E]">Bank Name</span>
                    <span className="font-semibold text-[#F5F2EB]">{paymentSettings.bankName}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[#A8A29E] block text-[11px]">Account Title</span>
                      <span className="text-[#F5F2EB] font-medium">
                        {paymentSettings.bankAccountTitle || '—'}
                      </span>
                    </div>
                    {paymentSettings.bankAccountTitle && (
                      <button
                        type="button"
                        onClick={() => handleCopy('title', paymentSettings.bankAccountTitle)}
                        className="inline-flex items-center gap-1 border border-white/15 px-2.5 py-1 text-[11px] text-[#D4AF37] hover:border-[#D4AF37]"
                      >
                        {copiedField === 'title' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedField === 'title' ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[#A8A29E] block text-[11px]">Account Number</span>
                      <span className="font-mono-tabular text-[#F5F2EB] font-semibold">
                        {paymentSettings.bankAccountNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('acc', paymentSettings.bankAccountNumber)}
                      className="inline-flex items-center gap-1 border border-white/15 px-2.5 py-1 text-[11px] text-[#D4AF37] hover:border-[#D4AF37]"
                    >
                      {copiedField === 'acc' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedField === 'acc' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {paymentSettings.bankIban && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[#A8A29E] block text-[11px]">IBAN</span>
                        <span className="font-mono-tabular text-[#F5F2EB] break-all">
                          {paymentSettings.bankIban}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('iban', paymentSettings.bankIban)}
                        className="inline-flex items-center gap-1 border border-white/15 px-2.5 py-1 text-[11px] text-[#D4AF37] hover:border-[#D4AF37] shrink-0"
                      >
                        {copiedField === 'iban' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedField === 'iban' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}

                  {paymentSettings.bankSwiftCode && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#A8A29E]">SWIFT / BIC Code</span>
                      <span className="font-mono-tabular text-[#F5F2EB]">
                        {paymentSettings.bankSwiftCode}
                      </span>
                    </div>
                  )}

                  {paymentSettings.bankInstructions && (
                    <p className="pt-2 border-t border-white/10 text-[11px] text-[#A8A29E] leading-relaxed">
                      {paymentSettings.bankInstructions}
                    </p>
                  )}
                </div>
              )}

              {/* Customer Submission Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#D4AF37] mb-1 font-medium">
                    Transaction ID (TID)
                  </label>
                  <input
                    type="text"
                    required
                    value={bankReference}
                    onChange={(e) => setBankReference(e.target.value)}
                    placeholder="e.g. IBFT-9041827"
                    className="w-full border border-white/15 bg-[#141417] px-3 py-2 text-xs font-mono-tabular text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#D4AF37] mb-1 font-medium">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={bankPaymentDate}
                    onChange={(e) => setBankPaymentDate(e.target.value)}
                    className="w-full border border-white/15 bg-[#141417] px-3 py-2 text-xs font-mono-tabular text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#D4AF37] mb-1.5 font-medium">
                  Upload Payment Receipt (PNG, JPG, WEBP, or PDF · Max 5MB)
                </label>
                <label className="flex flex-col items-center justify-center border border-dashed border-[#D4AF37]/40 bg-[#141417] px-4 py-5 cursor-pointer hover:border-[#D4AF37] transition-colors">
                  {uploadingReceipt ? (
                    <span className="text-xs text-[#D4AF37]">Validating &amp; uploading receipt...</span>
                  ) : receiptFilename ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-300">
                      <FileCheck2 className="h-4 w-4 shrink-0" />
                      <span className="truncate max-w-xs">{receiptLabel}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-center">
                      <UploadCloud className="h-5 w-5 text-[#D4AF37]" />
                      <span className="text-xs text-[#F5F2EB]">
                        Click to select bank transfer screenshot or PDF
                      </span>
                      <span className="text-[11px] text-[#78716C]">
                        Receipts are inspected before order dispatch
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleReceiptUpload(file);
                    }}
                  />
                </label>
              </div>

              <div className="flex items-start gap-2 border border-white/10 bg-[#141417] p-3 text-[11px] text-[#A8A29E]">
                <ShieldCheck className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>
                  Your order enters <strong>Pending Verification</strong> immediately after submission and is confirmed once GLOWORA admin verifies the transfer receipt and Transaction ID.
                </span>
              </div>

              {modalError && (
                <div className="border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveGatewayModal(null)}
                  className="border border-white/15 px-4 py-2.5 text-xs text-[#A8A29E] hover:text-[#F5F2EB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !bankConfigured || uploadingReceipt}
                  className="flex-1 bg-[#D4AF37] py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0A0A0B] hover:bg-[#E5C158] disabled:opacity-50"
                >
                  {submitting ? 'Submitting Verification...' : 'Submit Payment Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
