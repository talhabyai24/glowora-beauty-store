import { useState } from 'react';
import { PackageSearch, SlidersHorizontal, Star, User, X } from 'lucide-react';
import type { Order, Product, Review } from '../../types/glowora';

interface AccountOrdersModalProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  wishlistCount: number;
  onSubmitReview: (payload: {
    authorName: string;
    authorEmail: string;
    authorRole: string;
    rating: number;
    productName: string;
    quote: string;
  }) => Promise<void>;
  onOpenAdminBuilder: () => void;
}

const PAYMENT_LABELS: Record<string, string> = {
  jazzcash: 'JazzCash',
  bank_transfer: 'Bank Transfer',
  cod: 'Cash on Delivery',
  card: 'Card Payment',
};

export function AccountOrdersModal({
  open,
  onClose,
  products,
  wishlistCount,
  onSubmitReview,
  onOpenAdminBuilder,
}: AccountOrdersModalProps) {
  const [tab, setTab] = useState<'overview' | 'orders' | 'reviews'>('overview');
  const [email, setEmail] = useState('');
  const [loadedEmail, setLoadedEmail] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Account review submission state
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('');
  const [rating, setRating] = useState(5);
  const [productName, setProductName] = useState(products[0]?.name || '24K Gold Peptide Face Serum (30 ml)');
  const [quote, setQuote] = useState('');
  const [reviewNotice, setReviewNotice] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  if (!open) return null;

  const handleLoadAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cleanEmail = email.trim();
      const res = await fetch(`/api/account/summary?email=${encodeURIComponent(cleanEmail)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to load account.');
      setOrders(data.orders || []);
      setMyReviews(data.reviews || []);
      setLoadedEmail(cleanEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to retrieve account details.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setReviewNotice('');
    setSubmittingReview(true);
    try {
      await onSubmitReview({
        authorName,
        authorEmail: loadedEmail || email.trim(),
        authorRole,
        rating,
        productName,
        quote,
      });
      setReviewNotice('Your review has been published to GLOWORA Client Impressions.');
      setQuote('');
      if (loadedEmail || email.trim()) {
        const res = await fetch(
          `/api/account/summary?email=${encodeURIComponent(loadedEmail || email.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setMyReviews(data.reviews || []);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Client Account, Orders & Reviews"
    >
      <div className="w-full max-w-2xl border border-[#D4AF37]/30 bg-[#0E0E10] text-[#F5F2EB] p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <User className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="font-display text-2xl font-semibold">
              Client Account, Orders &amp; Reviews
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account modal"
            className="text-[#A8A29E] hover:text-[#F5F2EB]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Account Email Lookup Bar */}
        <form onSubmit={handleLoadAccount} className="space-y-2">
          <label className="block text-xs text-[#A8A29E]">
            Access your order history, JazzCash / Bank payment status, and account reviews:
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 border border-white/15 bg-[#141417] px-3.5 py-2.5 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold text-[#0A0A0B] hover:bg-[#E5C158] disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <PackageSearch className="h-4 w-4" />
              <span>{loading ? 'Loading...' : 'Load Account'}</span>
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </form>

        {/* Portal Tabs */}
        <div className="flex items-center gap-1 border-b border-white/10 pb-3">
          {[
            { id: 'overview', label: 'Account Summary' },
            { id: 'orders', label: `Orders (${orders.length})` },
            { id: 'reviews', label: `Reviews (${myReviews.length})` },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as typeof tab)}
              className={`px-3.5 py-1.5 text-xs font-medium transition-colors ${
                tab === item.id
                  ? 'bg-[#D4AF37] text-[#0A0A0B] font-semibold'
                  : 'text-[#A8A29E] hover:text-[#F5F2EB]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-white/10 bg-[#141417] p-4">
                <p className="text-[11px] text-[#A8A29E] uppercase tracking-wider">Orders</p>
                <p className="font-mono-tabular text-2xl font-semibold text-[#D4AF37] mt-1">
                  {orders.length}
                </p>
              </div>
              <div className="border border-white/10 bg-[#141417] p-4">
                <p className="text-[11px] text-[#A8A29E] uppercase tracking-wider">Total Spent</p>
                <p className="font-mono-tabular text-2xl font-semibold text-[#F5F2EB] mt-1">
                  ${totalSpent.toFixed(0)}
                </p>
              </div>
              <div className="border border-white/10 bg-[#141417] p-4">
                <p className="text-[11px] text-[#A8A29E] uppercase tracking-wider">
                  Account Reviews
                </p>
                <p className="font-mono-tabular text-2xl font-semibold text-[#F5F2EB] mt-1">
                  {myReviews.length}
                </p>
              </div>
            </div>

            <div className="border border-white/10 bg-[#141417] p-4 text-xs text-[#A8A29E] flex items-center justify-between">
              <span>
                {loadedEmail
                  ? `Active Account: ${loadedEmail}`
                  : 'Enter your email above to sync past orders and submitted reviews.'}
              </span>
              <span className="font-mono-tabular text-[#D4AF37]">
                Wishlist: {wishlistCount} saved
              </span>
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div className="max-h-64 overflow-y-auto space-y-3">
            {orders.length === 0 ? (
              <p className="border border-white/10 bg-[#141417] p-5 text-xs text-[#A8A29E]">
                {loadedEmail
                  ? `No orders found for ${loadedEmail}.`
                  : 'Load your account email above to view orders and payment verification status.'}
              </p>
            ) : (
              orders.map((order) => {
                const badgeClass =
                  order.paymentStatus === 'Paid' ||
                  order.paymentStatus === 'Verified Paid' ||
                  order.paymentStatus === 'Paid via Card'
                    ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                    : order.paymentStatus === 'Pending Verification' ||
                        order.paymentStatus === 'Initiated'
                      ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#E5C158]'
                      : order.paymentStatus === 'Rejected' ||
                          order.paymentStatus === 'Failed' ||
                          order.paymentStatus === 'Cancelled'
                        ? 'border-red-500/40 bg-red-950/40 text-red-300'
                        : 'border-white/20 bg-white/5 text-[#D6D3CD]';

                return (
                  <div key={order.id} className="border border-white/10 bg-[#141417] p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono-tabular font-semibold text-[#D4AF37]">
                        #{order.id}
                      </span>
                      <span className={`border px-2 py-0.5 text-[10px] font-medium ${badgeClass}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-[#E7E2D8]">{order.status}</span>
                      <span aria-hidden="true" className="text-[#3F3F46]">·</span>
                      <span className="text-[#D4AF37]">
                        {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                      </span>
                      <span aria-hidden="true" className="text-[#3F3F46]">·</span>
                      <span className="text-[#A8A29E]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {(order.paymentReference || order.paymentDate) && (
                      <p className="font-mono-tabular text-[11px] text-[#A8A29E]">
                        {order.paymentReference ? `TID: ${order.paymentReference}` : ''}
                        {order.paymentReference && order.paymentDate ? ' · ' : ''}
                        {order.paymentDate ? `Paid: ${order.paymentDate}` : ''}
                      </p>
                    )}
                    {order.rejectionReason && (
                      <p className="border border-red-500/30 bg-red-950/30 px-2.5 py-1.5 text-[11px] text-red-300">
                        Rejection Reason: {order.rejectionReason}
                      </p>
                    )}
                    <div className="flex justify-between text-xs pt-2 border-t border-white/10">
                      <span className="text-[#A8A29E]">{order.items.length} items</span>
                      <span className="font-mono-tabular text-[#F5F2EB] font-semibold">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'reviews' && (
          <div className="space-y-5">
            {myReviews.length > 0 && (
              <div className="space-y-2.5 max-h-40 overflow-y-auto">
                <p className="text-xs font-medium text-[#D4AF37]">Reviews Linked to Your Account</p>
                {myReviews.map((r) => (
                  <div key={r.id} className="border border-white/10 bg-[#141417] p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#F5F2EB]">{r.productName}</span>
                      <span className="font-mono-tabular text-[#D4AF37]">{r.rating}/5 ★</span>
                    </div>
                    <p className="text-xs text-[#A8A29E]">“{r.quote}”</p>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleReviewSubmit}
              className="border border-white/10 bg-[#141417] p-4 space-y-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                Write an Account Review
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Your Name"
                  className="border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
                />
                <input
                  type="text"
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  placeholder="City or Role (e.g. Lahore)"
                  className="border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <select
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#A8A29E] mr-1">Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          star <= rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-[#3F3F46]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                required
                rows={2}
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="Share your honest experience with this formulation..."
                className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
              />

              {reviewNotice && <p className="text-xs text-[#D4AF37]">{reviewNotice}</p>}

              <button
                type="submit"
                disabled={submittingReview}
                className="bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0A0A0B] hover:bg-[#E5C158] disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Account Review'}
              </button>
            </form>
          </div>
        )}

        <div className="border-t border-white/10 pt-4 flex items-center justify-between gap-4">
          <div className="text-xs text-[#A8A29E]">
            Store Administrator? Manage catalog, orders, SEO, and JazzCash / Bank settings.
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAdminBuilder();
            }}
            className="inline-flex items-center gap-1.5 border border-[#D4AF37]/50 px-4 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0B] whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Store Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
