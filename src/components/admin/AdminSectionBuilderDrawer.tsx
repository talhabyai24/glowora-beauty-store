import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Building2,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  History,
  Lock,
  LogOut,
  Package,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import {
  DEFAULT_CATEGORIES,
  STUDIO_MEDIA_LIBRARY,
  type Order,
  type PaymentSettings,
  type PaymentTransactionLog,
  type Product,
  type ProductCategory,
  type SeoSettings,
  type StoreSection,
} from '../../types/glowora';
import { SectionConfigEditor } from './SectionConfigEditor';

interface AdminSectionBuilderDrawerProps {
  open: boolean;
  onClose: () => void;
  sections: StoreSection[];
  products: Product[];
  paymentSettings: PaymentSettings;
  seoSettings: SeoSettings;
  adminToken: string | null;
  onAdminTokenChange: (token: string | null) => void;
  onUpdateSection: (
    sectionId: StoreSection['id'],
    updates: { enabled?: boolean; label?: string; config?: Record<string, unknown> }
  ) => Promise<void>;
  onReorderSections: (orderedIds: string[]) => Promise<void>;
  onResetSections: () => Promise<void>;
  onSaveProduct: (product: Partial<Product>) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onSavePaymentSettings: (settings: PaymentSettings) => Promise<void>;
  onSaveSeoSettings: (settings: SeoSettings) => Promise<void>;
  onApprovePayment: (orderId: string) => Promise<Order>;
  onRejectPayment: (orderId: string, reason: string) => Promise<Order>;
}

function getPaymentStatusBadge(status: string): string {
  if (status === 'Paid' || status === 'Verified Paid' || status === 'Paid via Card') {
    return 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300';
  }
  if (status === 'Pending Verification' || status === 'Initiated') {
    return 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#E5C158]';
  }
  if (status === 'Rejected' || status === 'Failed' || status === 'Cancelled') {
    return 'border-red-500/40 bg-red-950/40 text-red-300';
  }
  return 'border-white/20 bg-white/5 text-[#D6D3CD]';
}

export function AdminSectionBuilderDrawer({
  open,
  onClose,
  sections,
  products,
  paymentSettings,
  seoSettings,
  adminToken,
  onAdminTokenChange,
  onUpdateSection,
  onReorderSections,
  onResetSections,
  onSaveProduct,
  onDeleteProduct,
  onSavePaymentSettings,
  onSaveSeoSettings,
  onApprovePayment,
  onRejectPayment,
}: AdminSectionBuilderDrawerProps) {
  const [authStatus, setAuthStatus] = useState<{ envConfigured: boolean; claimed: boolean } | null>(null);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [tab, setTab] = useState<'sections' | 'products' | 'payments' | 'settings'>('sections');
  const [paymentSubView, setPaymentSubView] = useState<'requests' | 'logs'>('requests');
  const [editingSectionId, setEditingSectionId] = useState<StoreSection['id'] | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [txLogs, setTxLogs] = useState<PaymentTransactionLog[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Receipt & Reject modals
  const [viewingReceipt, setViewingReceipt] = useState<{
    orderId: string;
    filename: string;
    blobUrl: string;
    isPdf: boolean;
  } | null>(null);
  const [rejectModalOrderId, setRejectModalOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [paymentActionError, setPaymentActionError] = useState('');

  const [payDraft, setPayDraft] = useState<PaymentSettings>(paymentSettings);
  const [seoDraft, setSeoDraft] = useState<SeoSettings>(seoSettings);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    setPayDraft(paymentSettings);
  }, [paymentSettings]);

  useEffect(() => {
    setSeoDraft(seoSettings);
  }, [seoSettings]);

  useEffect(() => {
    if (!open) return;
    fetch('/api/admin/auth-status')
      .then((r) => r.json())
      .then((data) => setAuthStatus(data))
      .catch(() => setAuthStatus({ envConfigured: false, claimed: true }));
  }, [open]);

  const fetchPayments = useCallback(async () => {
    if (!adminToken) return;
    setPaymentsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.set('status', statusFilter);
      if (methodFilter !== 'All') params.set('method', methodFilter);
      if (paymentSearch.trim()) params.set('q', paymentSearch.trim());

      const res = await fetch(`/api/admin/payments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status === 401) {
        onAdminTokenChange(null);
        return;
      }
      const data = await res.json();
      setOrders(data.orders || []);
      setTxLogs(data.logs || []);
      setPendingCount(Number(data.pendingCount || 0));
    } catch {
      setOrders([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, [adminToken, statusFilter, methodFilter, paymentSearch, onAdminTokenChange]);

  useEffect(() => {
    if (!open || !adminToken) return;
    fetchPayments();
  }, [open, adminToken, tab, fetchPayments]);

  useEffect(() => {
    return () => {
      if (viewingReceipt?.blobUrl) {
        URL.revokeObjectURL(viewingReceipt.blobUrl);
      }
    };
  }, [viewingReceipt]);

  if (!open) return null;

  const isFirstRunClaim = authStatus && !authStatus.envConfigured && !authStatus.claimed;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const endpoint = isFirstRunClaim ? '/api/admin/claim' : '/api/admin/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed.');
      onAdminTokenChange(data.token);
      setPasscode('');
      setAuthStatus((prev) => (prev ? { ...prev, claimed: true } : prev));
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to authenticate.');
    } finally {
      setAuthLoading(false);
    }
  };

  const flashNotice = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const handleMoveSection = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    await onReorderSections(next.map((s) => s.id));
    flashNotice('Section order updated');
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    await onSaveProduct(editingProduct);
    setEditingProduct(null);
    flashNotice('Product saved to database');
  };

  const handleViewReceipt = async (order: Order) => {
    if (!adminToken || !order.receiptFilename) return;
    setPaymentActionError('');
    try {
      const res = await fetch(`/api/admin/receipts/${encodeURIComponent(order.receiptFilename)}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error('Unable to load uploaded receipt.');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      setViewingReceipt({
        orderId: order.id,
        filename: order.receiptFilename,
        blobUrl,
        isPdf: order.receiptFilename.toLowerCase().endsWith('.pdf'),
      });
    } catch (err) {
      setPaymentActionError(err instanceof Error ? err.message : 'Could not load receipt.');
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    setPaymentActionError('');
    try {
      await onApprovePayment(orderId);
      await fetchPayments();
      flashNotice(`Order #${orderId} verified & approved`);
    } catch (err) {
      setPaymentActionError(err instanceof Error ? err.message : 'Approval failed.');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalOrderId) return;
    setPaymentActionError('');
    try {
      await onRejectPayment(rejectModalOrderId, rejectReason.trim());
      flashNotice(`Order #${rejectModalOrderId} rejected`);
      setRejectModalOrderId(null);
      setRejectReason('');
      await fetchPayments();
    } catch (err) {
      setPaymentActionError(err instanceof Error ? err.message : 'Rejection failed.');
    }
  };

  const editingSection = editingSectionId
    ? sections.find((s) => s.id === editingSectionId) || null
    : null;

  const categorySection = sections.find((s) => s.id === 'categories');
  const dynamicCategories = Array.from(
    new Set([
      ...(categorySection
        ? ((categorySection.config as { items?: Array<{ name: string }> }).items || []).map(
            (i) => i.name
          )
        : []),
      ...products.map((p) => p.category),
      ...DEFAULT_CATEGORIES,
    ])
  ).filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="GLOWORA Section Builder"
    >
      <div className="flex h-full w-full max-w-2xl flex-col border-l border-[#D4AF37]/30 bg-[#0E0E10] text-[#F5F2EB]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-[#141417]">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="h-4.5 w-4.5 text-[#D4AF37]" />
            <div>
              <h2 className="font-display text-xl font-semibold leading-none">
                GLOWORA Section Builder
              </h2>
              <p className="text-[11px] text-[#A8A29E] mt-1">
                Customize sections, JazzCash/Bank accounts, SEO &amp; catalog
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {adminToken && (
              <button
                type="button"
                onClick={() => {
                  onAdminTokenChange(null);
                  setEditingSectionId(null);
                  setEditingProduct(null);
                }}
                title="Lock Admin Session"
                className="flex h-8 w-8 items-center justify-center text-[#A8A29E] hover:text-[#D4AF37]"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close section builder"
              className="flex h-8 w-8 items-center justify-center text-[#A8A29E] hover:text-[#F5F2EB]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Auth Gate */}
        {!adminToken ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <form
              onSubmit={handleAuthSubmit}
              className="w-full max-w-sm border border-[#D4AF37]/30 bg-[#141417] p-6 space-y-5"
            >
              <div className="flex items-center gap-2.5 text-[#D4AF37]">
                <Lock className="h-5 w-5" />
                <h3 className="font-display text-2xl font-semibold text-[#F5F2EB]">
                  {isFirstRunClaim ? 'Claim Admin Passcode' : 'Admin Sign In'}
                </h3>
              </div>

              <p className="text-xs leading-relaxed text-[#A8A29E]">
                {isFirstRunClaim
                  ? 'Set your private administrator passcode (6+ characters) to unlock live section editing, JazzCash/Bank settings, SEO, and product management.'
                  : 'Enter your administrator passcode to manage sections, payments, SEO, and products.'}
              </p>

              <div>
                <label className="block text-xs text-[#A8A29E] mb-1.5">
                  {isFirstRunClaim ? 'Create Passcode' : 'Admin Passcode'}
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full border border-white/15 bg-[#0A0A0B] px-3.5 py-2.5 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              {authError && <p className="text-xs text-red-400">{authError}</p>}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#D4AF37] py-3 text-xs font-semibold tracking-[0.14em] uppercase text-[#0A0A0B] hover:bg-[#E5C158] disabled:opacity-50"
              >
                {authLoading
                  ? 'Verifying...'
                  : isFirstRunClaim
                    ? 'Claim & Open Builder'
                    : 'Unlock Section Builder'}
              </button>
            </form>
          </div>
        ) : editingSection ? (
          <SectionConfigEditor
            section={editingSection}
            onCancel={() => setEditingSectionId(null)}
            onSave={async (id, config, label) => {
              await onUpdateSection(id, { config, label });
              setEditingSectionId(null);
              flashNotice(`Saved "${label}"`);
            }}
          />
        ) : editingProduct ? (
          <form onSubmit={handleProductSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <h3 className="font-display text-2xl font-semibold text-[#F5F2EB]">
                {editingProduct.id ? 'Edit Formulation' : 'New Formulation'}
              </h3>

              <div>
                <label className="block text-xs text-[#A8A29E] mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#A8A29E] mb-1">Category</label>
                  <select
                    value={editingProduct.category || 'Skincare'}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value as ProductCategory,
                      })
                    }
                    className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB]"
                  >
                    {dynamicCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#A8A29E] mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={editingProduct.badgeText || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, badgeText: e.target.value })
                    }
                    placeholder="e.g. Best Seller"
                    className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-[#A8A29E] mb-1">Price ($)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    step="0.01"
                    value={editingProduct.price ?? 95}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                    }
                    className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB] font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A8A29E] mb-1">Compare At ($)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={editingProduct.originalPrice ?? ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        originalPrice: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB] font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A8A29E] mb-1">Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.stock ?? 25}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })
                    }
                    className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB] font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#A8A29E] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#A8A29E] mb-1">Product Image URL</label>
                <input
                  type="text"
                  value={editingProduct.imageUrl || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, imageUrl: e.target.value })
                  }
                  className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB] mb-2"
                />
                <div className="grid grid-cols-4 gap-2">
                  {STUDIO_MEDIA_LIBRARY.map((m) => (
                    <button
                      key={m.url}
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, imageUrl: m.url })}
                      className={`aspect-[4/3] overflow-hidden border ${
                        editingProduct.imageUrl === m.url ? 'border-[#D4AF37]' : 'border-white/15 opacity-75'
                      }`}
                    >
                      <img src={m.url} alt={m.label} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="block text-xs text-[#A8A29E]">
                  Single Homepage Section Placement (Prevents Duplicate Cards)
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { key: 'isFeatured', label: 'Featured Edit' },
                    { key: 'isBestseller', label: 'Best Sellers Slider' },
                    { key: 'isNewArrival', label: 'New Arrivals Carousel' },
                    { key: 'isFlashSale', label: 'Flash Sale Vault' },
                  ].map((flag) => {
                    const active = Boolean(editingProduct[flag.key as keyof Product]);
                    return (
                      <button
                        key={flag.key}
                        type="button"
                        onClick={() =>
                          setEditingProduct({
                            ...editingProduct,
                            isFeatured: flag.key === 'isFeatured',
                            isBestseller: flag.key === 'isBestseller',
                            isNewArrival: flag.key === 'isNewArrival',
                            isFlashSale: flag.key === 'isFlashSale',
                          })
                        }
                        className={`border px-3 py-2 text-xs text-left transition-colors ${
                          active
                            ? 'border-[#D4AF37] bg-[#1C1C21] text-[#D4AF37] font-semibold'
                            : 'border-white/10 bg-[#141417] text-[#A8A29E] hover:border-white/25'
                        }`}
                      >
                        {flag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 bg-[#141417] p-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 text-xs text-[#A8A29E] hover:text-[#F5F2EB]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#D4AF37] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0A0A0B] hover:bg-[#E5C158]"
              >
                Save Formulation
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-2.5 bg-[#0A0A0B] gap-2 overflow-x-auto">
              <div className="flex items-center gap-1 shrink-0">
                {[
                  { id: 'sections', label: `Sections (${sections.length})` },
                  { id: 'products', label: `Products (${products.length})` },
                  {
                    id: 'payments',
                    label: pendingCount > 0 ? `Payments (${pendingCount} Pending)` : 'Payments',
                  },
                  { id: 'settings', label: 'Bank & SEO' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id as typeof tab)}
                    className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                      tab === t.id
                        ? 'bg-[#D4AF37] text-[#0A0A0B] font-semibold'
                        : 'text-[#A8A29E] hover:text-[#F5F2EB]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {statusMessage && (
                <span className="text-[11px] font-medium text-[#D4AF37] whitespace-nowrap">
                  {statusMessage}
                </span>
              )}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {tab === 'sections' && (
                <>
                  <div className="flex items-center justify-between pb-2">
                    <p className="text-xs text-[#A8A29E]">
                      Reorder, toggle visibility, or edit any section live.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        await onResetSections();
                        flashNotice('Restored default layout');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-[#A8A29E] hover:text-[#D4AF37]"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset Layout</span>
                    </button>
                  </div>

                  {sections.map((section, idx) => (
                    <div
                      key={section.id}
                      className={`flex items-center justify-between gap-3 border p-3.5 transition-colors ${
                        section.enabled
                          ? 'border-white/10 bg-[#141417]'
                          : 'border-white/5 bg-[#0A0A0B] opacity-60'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#F5F2EB] truncate">
                          {section.label}
                        </p>
                        <p className="font-mono-tabular text-[11px] text-[#78716C]">
                          Order #{idx + 1} · {section.enabled ? 'Visible' : 'Hidden'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSection(idx, -1)}
                          aria-label={`Move ${section.label} up`}
                          className="p-1.5 text-[#A8A29E] hover:text-[#D4AF37] disabled:opacity-30"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === sections.length - 1}
                          onClick={() => handleMoveSection(idx, 1)}
                          aria-label={`Move ${section.label} down`}
                          className="p-1.5 text-[#A8A29E] hover:text-[#D4AF37] disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await onUpdateSection(section.id, { enabled: !section.enabled });
                            flashNotice(
                              `${section.label} ${!section.enabled ? 'enabled' : 'disabled'}`
                            );
                          }}
                          aria-label={section.enabled ? `Hide ${section.label}` : `Show ${section.label}`}
                          className={`p-1.5 ${
                            section.enabled ? 'text-[#D4AF37]' : 'text-[#78716C]'
                          } hover:text-[#E5C158]`}
                        >
                          {section.enabled ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSectionId(section.id)}
                          className="ml-1 inline-flex items-center gap-1 border border-[#D4AF37]/40 px-2.5 py-1.5 text-xs font-medium text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0B] transition-colors"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {tab === 'products' && (
                <>
                  <div className="flex items-center justify-between pb-2">
                    <p className="text-xs text-[#A8A29E]">
                      SQLite product catalog powering all product sections.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingProduct({
                          name: '',
                          category: 'Skincare',
                          price: 120,
                          stock: 20,
                          imageUrl: STUDIO_MEDIA_LIBRARY[1].url,
                          isFeatured: true,
                          isBestseller: false,
                          isNewArrival: true,
                          isFlashSale: false,
                        })
                      }
                      className="inline-flex items-center gap-1.5 bg-[#D4AF37] px-3 py-1.5 text-xs font-semibold text-[#0A0A0B] hover:bg-[#E5C158]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Product</span>
                    </button>
                  </div>

                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 border border-white/10 bg-[#141417] p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="h-12 w-14 object-cover bg-[#0A0A0B] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#F5F2EB] truncate">
                            {product.name}
                          </p>
                          <p className="font-mono-tabular text-xs text-[#A8A29E]">
                            {product.category} · ${product.price} · Stock {product.stock}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(product)}
                          className="border border-[#D4AF37]/40 px-2.5 py-1.5 text-xs text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0B]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await onDeleteProduct(product.id);
                            flashNotice('Product deleted');
                          }}
                          aria-label={`Delete ${product.name}`}
                          className="p-1.5 text-[#78716C] hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {tab === 'payments' && (
                <div className="space-y-4">
                  {/* Pending Bank Verification Alert Banner */}
                  {pendingCount > 0 && (
                    <div className="flex items-center justify-between border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-4 py-2.5 text-xs">
                      <span className="text-[#E5C158] font-medium">
                        {pendingCount} Bank Transfer {pendingCount === 1 ? 'request' : 'requests'} awaiting verification
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentSubView('requests');
                          setStatusFilter('Pending Verification');
                        }}
                        className="text-[11px] font-semibold text-[#D4AF37] underline"
                      >
                        Review Pending
                      </button>
                    </div>
                  )}

                  {/* Sub-Navigation + Filters */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPaymentSubView('requests')}
                        className={`px-3 py-1.5 text-xs font-medium ${
                          paymentSubView === 'requests'
                            ? 'bg-[#1C1C21] border border-[#D4AF37]/50 text-[#D4AF37]'
                            : 'text-[#A8A29E] hover:text-[#F5F2EB]'
                        }`}
                      >
                        Transactions ({orders.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentSubView('logs')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${
                          paymentSubView === 'logs'
                            ? 'bg-[#1C1C21] border border-[#D4AF37]/50 text-[#D4AF37]'
                            : 'text-[#A8A29E] hover:text-[#F5F2EB]'
                        }`}
                      >
                        <History className="h-3.5 w-3.5" />
                        <span>Audit Logs ({txLogs.length})</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTab('settings')}
                      className="text-[11px] text-[#D4AF37] hover:underline"
                    >
                      Configure Bank &amp; Methods →
                    </button>
                  </div>

                  {paymentActionError && (
                    <div className="border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{paymentActionError}</span>
                    </div>
                  )}

                  {paymentSubView === 'requests' ? (
                    <>
                      {/* Search & Filter Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="relative">
                          <Search className="h-3.5 w-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="search"
                            value={paymentSearch}
                            onChange={(e) => setPaymentSearch(e.target.value)}
                            placeholder="Search Order #, TID, email..."
                            className="w-full border border-white/15 bg-[#141417] pl-8 pr-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
                          />
                        </div>
                        <select
                          value={methodFilter}
                          onChange={(e) => setMethodFilter(e.target.value)}
                          className="border border-white/15 bg-[#141417] px-3 py-2 text-xs text-[#F5F2EB]"
                        >
                          <option value="All">All Methods</option>
                          <option value="jazzcash">JazzCash Gateway</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="cod">Cash on Delivery</option>
                          <option value="card">Card</option>
                        </select>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="border border-white/15 bg-[#141417] px-3 py-2 text-xs text-[#F5F2EB]"
                        >
                          <option value="All">All Statuses</option>
                          <option value="Pending Verification">Pending Verification</option>
                          <option value="Verified Paid">Verified Paid</option>
                          <option value="Paid">Paid (JazzCash)</option>
                          <option value="Initiated">Initiated</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Failed">Failed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      {paymentsLoading ? (
                        <p className="text-xs text-[#A8A29E] py-6 text-center">
                          Loading payment records...
                        </p>
                      ) : orders.length === 0 ? (
                        <div className="border border-white/10 bg-[#141417] p-8 text-center space-y-2">
                          <Package className="h-8 w-8 text-[#3F3F46] mx-auto" />
                          <p className="text-sm text-[#A8A29E]">
                            No orders or payment transactions match your filters.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {orders.map((order) => (
                            <div
                              key={order.id}
                              className="border border-white/10 bg-[#141417] p-4 space-y-2.5"
                            >
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono-tabular font-semibold text-[#D4AF37]">
                                    #{order.id}
                                  </span>
                                  <span
                                    className={`border px-2 py-0.5 text-[10px] font-medium ${getPaymentStatusBadge(
                                      order.paymentStatus
                                    )}`}
                                  >
                                    {order.paymentStatus}
                                  </span>
                                </div>
                                <span className="font-mono-tabular text-sm font-semibold text-[#F5F2EB]">
                                  ${order.total.toFixed(2)}
                                </span>
                              </div>

                              <p className="text-xs text-[#E7E2D8]">
                                {order.customerName} · {order.customerEmail} · {order.customerPhone}
                              </p>
                              <p className="text-[11px] text-[#A8A29E]">
                                {order.shippingAddress}{' '}
                                {order.postalCode ? `(${order.postalCode})` : ''}
                              </p>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#A8A29E] font-mono-tabular">
                                <span className="text-[#D4AF37] uppercase">
                                  {order.paymentMethod.replace('_', ' ')}
                                </span>
                                {order.paymentReference && <span>TID: {order.paymentReference}</span>}
                                {order.paymentDate && <span>Date: {order.paymentDate}</span>}
                              </div>

                              {order.rejectionReason && (
                                <p className="border border-red-500/30 bg-red-950/30 px-2.5 py-1.5 text-[11px] text-red-300">
                                  Rejected: {order.rejectionReason}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                                <div className="flex items-center gap-2">
                                  {order.receiptFilename && (
                                    <button
                                      type="button"
                                      onClick={() => handleViewReceipt(order)}
                                      className="inline-flex items-center gap-1 border border-[#D4AF37]/40 px-2.5 py-1 text-[11px] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0B]"
                                    >
                                      <FileText className="h-3 w-3" />
                                      <span>View Receipt</span>
                                    </button>
                                  )}
                                </div>

                                {(order.paymentStatus === 'Pending Verification' ||
                                  order.paymentMethod === 'bank_transfer') &&
                                  order.paymentStatus !== 'Verified Paid' &&
                                  order.paymentStatus !== 'Rejected' && (
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRejectModalOrderId(order.id);
                                          setRejectReason('');
                                        }}
                                        className="inline-flex items-center gap-1 border border-red-500/40 px-2.5 py-1 text-[11px] text-red-300 hover:bg-red-950/50"
                                      >
                                        <XCircle className="h-3 w-3" />
                                        <span>Reject</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleApproveOrder(order.id)}
                                        className="inline-flex items-center gap-1 bg-[#D4AF37] px-3 py-1 text-[11px] font-semibold text-[#0A0A0B] hover:bg-[#E5C158]"
                                      >
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>Approve Payment</span>
                                      </button>
                                    </div>
                                  )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-2.5">
                      {txLogs.length === 0 ? (
                        <p className="border border-white/10 bg-[#141417] p-6 text-center text-xs text-[#A8A29E]">
                          No payment transaction events logged yet.
                        </p>
                      ) : (
                        txLogs.map((log) => (
                          <div
                            key={log.id}
                            className="border border-white/10 bg-[#141417] p-3.5 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono-tabular font-semibold text-[#D4AF37]">
                                #{log.orderId} · {log.paymentMethod.toUpperCase()}
                              </span>
                              <span
                                className={`border px-2 py-0.5 text-[10px] ${getPaymentStatusBadge(
                                  log.status
                                )}`}
                              >
                                {log.status}
                              </span>
                            </div>
                            <p className="text-[#D6D3CD]">{log.message}</p>
                            <div className="flex justify-between font-mono-tabular text-[11px] text-[#78716C]">
                              <span>
                                Ref: {log.txnRefNo}
                                {log.gatewayCode ? ` · Code ${log.gatewayCode}` : ''} · By {log.actor}
                              </span>
                              <span>${log.amount.toFixed(2)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {tab === 'settings' && (
                <div className="space-y-6">
                  {/* Payment Methods & Gateway Configuration */}
                  <div className="border border-white/10 bg-[#141417] p-4 space-y-4">
                    <h3 className="font-display text-xl font-semibold text-[#D4AF37]">
                      Payment Gateways &amp; Real Bank Account
                    </h3>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 border border-white/10 bg-[#0A0A0B] p-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={payDraft.jazzcashEnabled}
                          onChange={(e) =>
                            setPayDraft({ ...payDraft, jazzcashEnabled: e.target.checked })
                          }
                          className="accent-[#D4AF37]"
                        />
                        <span>Enable JazzCash</span>
                      </label>
                      <label className="flex items-center gap-2 border border-white/10 bg-[#0A0A0B] p-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={payDraft.bankEnabled}
                          onChange={(e) =>
                            setPayDraft({ ...payDraft, bankEnabled: e.target.checked })
                          }
                          className="accent-[#D4AF37]"
                        />
                        <span>Enable Bank Transfer</span>
                      </label>
                      <label className="flex items-center gap-2 border border-white/10 bg-[#0A0A0B] p-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={payDraft.codEnabled}
                          onChange={(e) =>
                            setPayDraft({ ...payDraft, codEnabled: e.target.checked })
                          }
                          className="accent-[#D4AF37]"
                        />
                        <span>Enable COD</span>
                      </label>
                      <label className="flex items-center gap-2 border border-white/10 bg-[#0A0A0B] p-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={payDraft.cardEnabled}
                          onChange={(e) =>
                            setPayDraft({ ...payDraft, cardEnabled: e.target.checked })
                          }
                          className="accent-[#D4AF37]"
                        />
                        <span>Enable Card</span>
                      </label>
                    </div>

                    {/* JazzCash Server Gateway Status */}
                    <div className="border border-white/10 bg-[#0A0A0B] p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#F5F2EB]">
                          <Smartphone className="h-3.5 w-3.5 text-[#D4AF37]" />
                          JazzCash Merchant Gateway
                        </span>
                        <span
                          className={`border px-2 py-0.5 text-[10px] font-medium ${
                            paymentSettings.jazzcashGatewayConfigured
                              ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                              : 'border-amber-500/40 bg-amber-950/30 text-amber-300'
                          }`}
                        >
                          {paymentSettings.jazzcashGatewayConfigured
                            ? 'Gateway Secrets Active'
                            : 'Env Secrets Pending'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A8A29E] leading-relaxed">
                        Official JazzCash Merchant ID, Password, and Integrity Salt are read exclusively from backend environment variables (`JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_INTEGRITY_SALT`).
                      </p>
                      <div>
                        <label className="block text-[11px] text-[#A8A29E] mb-1">
                          Display Merchant Name
                        </label>
                        <input
                          type="text"
                          value={payDraft.jazzcashDisplayName}
                          onChange={(e) =>
                            setPayDraft({ ...payDraft, jazzcashDisplayName: e.target.value })
                          }
                          className="w-full border border-white/15 bg-[#141417] px-3 py-2 text-xs text-[#F5F2EB]"
                        />
                      </div>
                    </div>

                    {/* Official Bank Account Configuration */}
                    <div className="border border-white/10 bg-[#0A0A0B] p-3.5 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F5F2EB]">
                        <Building2 className="h-3.5 w-3.5 text-[#D4AF37]" />
                        <span>Official Store Bank Account Details</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-[#A8A29E] mb-1">Bank Name</label>
                          <input
                            type="text"
                            value={payDraft.bankName}
                            onChange={(e) => setPayDraft({ ...payDraft, bankName: e.target.value })}
                            placeholder="Enter official bank name"
                            className="w-full border border-white/15 bg-[#141417] px-3 py-2 text-xs text-[#F5F2EB]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#A8A29E] mb-1">
                            Account Title
                          </label>
                          <input
                            type="text"
                            value={payDraft.bankAccountTitle}
                            onChange={(e) =>
                              setPayDraft({ ...payDraft, bankAccountTitle: e.target.value })
                            }
                            placeholder="Enter exact account title"
                            className="w-full border border-white/15 bg-[#141417] px-3 py-2 text-xs text-[#F5F2EB]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-[#A8A29E] mb-1">
                            Account Number
                          </label>
                          <input
                            type="text"
                            value={payDraft.bankAccountNumber}
                            onChange={(e) =>
                              setPayDraft({ ...payDraft, bankAccountNumber: e.target.value })
                            }
                            placeholder="Enter actual account number"
                            className="w-full border border-white/15 bg-[#141417] px-3 py-2 text-xs text-[#F5F2EB] font-mono-tabular"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#A8A29E] mb-1">IBAN</label>
                          <input
                            type="text"
                            value={payDraft.bankIban}
                            onChange={(e) => setPayDraft({ ...payDraft, bankIban: e.target.value })}
                            placeholder="Enter actual IBAN"
                            className="w-full border border-white/15 bg-[#141417] px-3 py-2 text-xs text-[#F5F2EB] font-mono-tabular"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#A8A29E] mb-1">
                          SWIFT / BIC Code (Optional)
                        </label>
                        <input
                          type="text"
                          value={payDraft.bankSwiftCode}
                          onChange={(e) =>
                            setPayDraft({ ...payDraft, bankSwiftCode: e.target.value })
                          }
                          placeholder="e.g. MEZNPKKA"
                          className="w-full border border-white/15 bg-[#141417] px-3 py-2 text-xs text-[#F5F2EB] font-mono-tabular"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#A8A29E] mb-1">
                          Transfer Instructions
                        </label>
                        <textarea
                          rows={2}
                          value={payDraft.bankInstructions}
                          onChange={(e) =>
                            setPayDraft({ ...payDraft, bankInstructions: e.target.value })
                          }
                          className="w-full border border-white/15 bg-[#141417] px-3 py-2 text-xs text-[#F5F2EB]"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        await onSavePaymentSettings(payDraft);
                        flashNotice('Payment settings saved');
                      }}
                      className="inline-flex items-center gap-1.5 bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold text-[#0A0A0B] hover:bg-[#E5C158]"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Save Payment Settings</span>
                    </button>
                  </div>

                  {/* SEO Settings */}
                  <div className="border border-white/10 bg-[#141417] p-4 space-y-3">
                    <h3 className="font-display text-xl font-semibold text-[#D4AF37]">
                      SEO &amp; Social Metadata
                    </h3>

                    <div>
                      <label className="block text-[11px] text-[#A8A29E] mb-1">
                        Meta Title (30–60 chars recommended)
                      </label>
                      <input
                        type="text"
                        value={seoDraft.metaTitle}
                        onChange={(e) => setSeoDraft({ ...seoDraft, metaTitle: e.target.value })}
                        className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#A8A29E] mb-1">
                        Meta Description (120–160 chars recommended)
                      </label>
                      <textarea
                        rows={2}
                        value={seoDraft.metaDescription}
                        onChange={(e) =>
                          setSeoDraft({ ...seoDraft, metaDescription: e.target.value })
                        }
                        className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#A8A29E] mb-1">SEO Keywords</label>
                      <input
                        type="text"
                        value={seoDraft.keywords}
                        onChange={(e) => setSeoDraft({ ...seoDraft, keywords: e.target.value })}
                        className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        await onSaveSeoSettings(seoDraft);
                        flashNotice('SEO metadata saved');
                      }}
                      className="bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0A0A0B] hover:bg-[#E5C158]"
                    >
                      Save SEO Metadata
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Secure Receipt Inspection Modal */}
      {viewingReceipt && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Inspect Payment Receipt"
        >
          <div className="w-full max-w-2xl border border-[#D4AF37]/40 bg-[#0E0E10] text-[#F5F2EB] overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 bg-[#141417]">
              <p className="font-mono-tabular text-xs text-[#D4AF37]">
                Receipt · Order #{viewingReceipt.orderId}
              </p>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="text-[#A8A29E] hover:text-[#F5F2EB]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 max-h-[75vh] overflow-auto flex justify-center bg-[#0A0A0B]">
              {viewingReceipt.isPdf ? (
                <iframe
                  src={viewingReceipt.blobUrl}
                  title={`Receipt ${viewingReceipt.orderId}`}
                  className="w-full h-[65vh] border border-white/10"
                />
              ) : (
                <img
                  src={viewingReceipt.blobUrl}
                  alt={`Payment receipt for ${viewingReceipt.orderId}`}
                  className="max-h-[65vh] w-auto object-contain border border-white/10"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Reason Modal */}
      {rejectModalOrderId && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Reject Payment"
        >
          <form
            onSubmit={handleRejectSubmit}
            className="w-full max-w-md border border-red-500/40 bg-[#0E0E10] p-6 space-y-4 text-[#F5F2EB]"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-red-300">
                Reject Payment · #{rejectModalOrderId}
              </h3>
              <button
                type="button"
                onClick={() => setRejectModalOrderId(null)}
                className="text-[#A8A29E] hover:text-[#F5F2EB]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs text-[#A8A29E] mb-1.5">
                Rejection Reason (visible to customer &amp; audit log)
              </label>
              <textarea
                required
                minLength={3}
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Transaction ID does not match bank statement or receipt amount is short."
                className="w-full border border-white/15 bg-[#141417] px-3 py-2 text-xs text-[#F5F2EB] focus:border-red-400 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalOrderId(null)}
                className="border border-white/15 px-4 py-2 text-xs text-[#A8A29E]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
