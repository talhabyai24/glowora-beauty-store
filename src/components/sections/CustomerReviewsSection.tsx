import { useState } from 'react';
import { ChevronLeft, ChevronRight, PenLine, Star, X } from 'lucide-react';
import type { CustomerReviewsConfig, Product, Review } from '../../types/glowora';

interface CustomerReviewsSectionProps {
  config: CustomerReviewsConfig;
  reviews: Review[];
  products: Product[];
  onSubmitReview: (payload: {
    authorName: string;
    authorRole: string;
    rating: number;
    productName: string;
    quote: string;
  }) => Promise<void>;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function CustomerReviewsSection({
  config,
  reviews,
  products,
  onSubmitReview,
}: CustomerReviewsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('');
  const [rating, setRating] = useState(5);
  const [productName, setProductName] = useState(
    products[0]?.name || '24K Gold Peptide Face Serum (30 ml)'
  );
  const [quote, setQuote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const visibleCount = Math.min(2, reviews.length);
  const maxIndex = Math.max(0, reviews.length - visibleCount);
  const clamped = Math.min(activeIndex, maxIndex);
  const visibleReviews = reviews.slice(clamped, clamped + 2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSubmitReview({ authorName, authorRole, rating, productName, quote });
      setAuthorName('');
      setAuthorRole('');
      setQuote('');
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="customer_reviews"
      className="bg-[#0E0E10] py-16 lg:py-24 border-b border-white/10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div className="space-y-2">
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#F5F2EB] text-balance">
              {config.heading}
            </h2>
            <p className="text-sm text-[#A8A29E] max-w-xl">{config.subtitle}</p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 border border-white/20 px-4 py-2 text-xs font-medium text-[#F5F2EB] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
            >
              <PenLine className="h-3.5 w-3.5" />
              <span>Write a Review</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                disabled={clamped === 0}
                aria-label="Previous reviews"
                className="flex h-9 w-9 items-center justify-center border border-white/15 text-[#F5F2EB] hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => Math.min(maxIndex, prev + 1))}
                disabled={clamped >= maxIndex}
                aria-label="Next reviews"
                className="flex h-9 w-9 items-center justify-center border border-white/15 text-[#F5F2EB] hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 border-t border-white/10 pt-10">
          {visibleReviews.map((rev) => (
            <article key={rev.id} className="flex flex-col justify-between gap-7">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1" aria-label={`${rev.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`h-3.5 w-3.5 ${
                          idx < rev.rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-[#3F3F46]'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-[#A8A29E] truncate">{rev.productName}</span>
                </div>

                <blockquote className="font-display text-2xl sm:text-[26px] leading-[1.38] text-[#F5F2EB]">
                  “{rev.quote}”
                </blockquote>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1C1C21] text-[11px] font-semibold tracking-wider text-[#D4AF37] shrink-0">
                  {getInitials(rev.authorName)}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-[#F5F2EB]">{rev.authorName}</span>
                  {rev.authorRole && (
                    <>
                      <span aria-hidden="true" className="text-[#57534E]">
                        ·
                      </span>
                      <span className="text-[#A8A29E]">{rev.authorRole}</span>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Write a Review Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Submit a customer review"
        >
          <div className="w-full max-w-lg border border-[#D4AF37]/35 bg-[#141417] p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-display text-2xl font-medium text-[#F5F2EB]">
                Write a Product Review
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close review modal"
                className="text-[#A8A29E] hover:text-[#F5F2EB]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#A8A29E] mb-1.5">Your Name</label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Ayesha Siddiqui"
                    className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2.5 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A8A29E] mb-1.5">City</label>
                  <input
                    type="text"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    placeholder="e.g. Lahore"
                    className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2.5 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#A8A29E] mb-1.5">Product</label>
                  <select
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2.5 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#A8A29E] mb-1.5">Rating</label>
                  <div className="flex items-center gap-2 py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        aria-label={`Rate ${star} stars`}
                        className="p-0.5"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-[#3F3F46]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#A8A29E] mb-1.5">Your Review</label>
                <textarea
                  required
                  rows={3}
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="Share texture, wear time, scent, or results..."
                  className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2.5 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-xs text-[#A8A29E] hover:text-[#F5F2EB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#D4AF37] px-6 py-2.5 text-xs font-semibold text-[#0A0A0B] hover:bg-[#E5C158] disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
