import { X } from 'lucide-react';
import type { BlogArticleConfig, BrandStoryConfig, InstagramTileConfig } from '../../types/glowora';
import { LuxuryImage } from '../ui/LuxuryImage';

export type InfoModalState =
  | { type: 'story'; data: BrandStoryConfig }
  | { type: 'article'; data: BlogArticleConfig }
  | { type: 'instagram'; data: InstagramTileConfig }
  | { type: 'policy'; key: string }
  | null;

interface InfoModalProps {
  state: InfoModalState;
  onClose: () => void;
}

const POLICY_COPY: Record<string, { title: string; subtitle: string; body: string }> = {
  shipping: {
    title: 'Express Shipping & Fulfillment',
    subtitle: 'Domestic & International Delivery',
    body: 'Orders placed before 14:00 dispatch within one business day via climate-protected courier. Orders over $150 qualify for complimentary express shipping across 45+ destinations (2–5 business days).',
  },
  returns: {
    title: '30-Day Returns & Exchanges',
    subtitle: 'Hassle-Free Return Support',
    body: 'Every full-size skincare and fragrance order includes a complimentary sample so you can test formulas before opening the main seal. Unopened or gently sampled items may be returned within 30 days.',
  },
  orders: {
    title: 'Order Tracking',
    subtitle: 'Real-Time Status',
    body: 'Click the Account icon in the header at any time to look up your order history, JazzCash receipt confirmation, or bank transfer verification status using your checkout email address.',
  },
  consultation: {
    title: 'Skin & Shade Consultation',
    subtitle: 'support@gloworabeauty.com · Mon – Sat',
    body: 'Need help selecting a serum pairing or shade match? Email our client care team anytime at support@gloworabeauty.com and receive personalized routine guidance.',
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'Data Protection',
    body: 'GLOWORA respects client privacy. Order details and email preferences are used exclusively to fulfill parcels and notify you about shipments. We never sell or share customer data.',
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'GLOWORA Beauty',
    body: 'All GLOWORA products are intended for external cosmetic use. Pricing, seasonal offers, and gift set availability are subject to current stock.',
  },
  ingredients: {
    title: 'Ingredient Standards',
    subtitle: 'Clean Formulation',
    body: 'All formulas are made without parabens, phthalates, mineral oils, silicones, or synthetic dyes. Botanicals are cold-pressed below 38°C and bottled in recyclable dark glass.',
  },
};

export function InfoModal({ state, onClose }: InfoModalProps) {
  if (!state) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl border border-[#D4AF37]/30 bg-[#0E0E10] text-[#F5F2EB] max-h-[88vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="sticky top-4 float-right mr-4 mt-4 z-10 flex h-9 w-9 items-center justify-center bg-[#0A0A0B]/85 border border-white/15 text-[#A8A29E] hover:text-[#F5F2EB]"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {state.type === 'story' && (
          <div className="p-6 sm:p-10 space-y-6">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4AF37]">
              {state.data.kicker}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#F5F2EB]">
              {state.data.heading}
            </h2>
            <div className="aspect-[16/9] w-full overflow-hidden border border-white/10">
              <LuxuryImage
                src={state.data.imageUrl}
                alt={state.data.heading}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-[#D6D3CD]">
              {state.data.body}
            </p>
            <p className="text-sm sm:text-base leading-relaxed text-[#A8A29E]">
              {state.data.extendedStory}
            </p>
          </div>
        )}

        {state.type === 'article' && (
          <div className="p-6 sm:p-10 space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#A8A29E]">
              <span className="border border-[#D4AF37]/40 bg-[#141417] px-2.5 py-0.5 text-[11px] font-medium text-[#D4AF37]">
                {state.data.category}
              </span>
              <span aria-hidden="true">·</span>
              <span>{state.data.publishedDate}</span>
              <span aria-hidden="true">·</span>
              <span>{state.data.readTime}</span>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-3xl sm:text-4xl font-medium leading-tight text-[#F5F2EB]">
                {state.data.title}
              </h2>
              <p className="text-xs text-[#78716C]">
                By GLOWORA Editorial Team
              </p>
            </div>

            <div className="aspect-[16/9] w-full overflow-hidden bg-[#141417]">
              <LuxuryImage
                src={state.data.imageUrl}
                alt={state.data.title}
                className="h-full w-full object-cover"
              />
            </div>

            <p className="bg-[#141417] p-4 text-base leading-relaxed text-[#E7E2D8] font-normal">
              {state.data.excerpt}
            </p>

            <div className="space-y-4 border-t border-white/10 pt-5">
              {state.data.fullContent
                .split(/\n\n+/)
                .filter(Boolean)
                .map((paragraph, idx) => (
                  <p
                    key={idx}
                    className="text-sm sm:text-base leading-relaxed text-[#D6D3CD]"
                  >
                    {paragraph}
                  </p>
                ))}
            </div>

            <div className="border-t border-white/10 pt-4 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0A0A0B] hover:bg-[#E5C158]"
              >
                Close Article
              </button>
            </div>
          </div>
        )}

        {state.type === 'instagram' && (
          <div className="p-6 sm:p-8 space-y-5">
            <div className="aspect-square max-h-[420px] w-full overflow-hidden border border-white/10">
              <LuxuryImage
                src={state.data.imageUrl}
                alt={state.data.caption}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#D4AF37]">{state.data.handleTag}</p>
              <p className="text-sm text-[#E7E2D8]">{state.data.caption}</p>
            </div>
          </div>
        )}

        {state.type === 'policy' && (
          <div className="p-6 sm:p-10 space-y-4">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4AF37]">
              {(POLICY_COPY[state.key] || POLICY_COPY.privacy).subtitle}
            </p>
            <h2 className="font-display text-3xl font-semibold text-[#F5F2EB]">
              {(POLICY_COPY[state.key] || POLICY_COPY.privacy).title}
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-[#D6D3CD]">
              {(POLICY_COPY[state.key] || POLICY_COPY.privacy).body}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
