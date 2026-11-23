import { ArrowUpRight, Mail, SlidersHorizontal } from 'lucide-react';
import type { FooterConfig } from '../../types/glowora';
import { JazzCashLogo } from '../ui/JazzCashLogo';

interface FooterSectionProps {
  config: FooterConfig;
  onNavigate: (target: string) => void;
  onOpenPolicyModal: (modalKey: string) => void;
  onOpenAdminBuilder: () => void;
}

export function FooterSection({
  config,
  onNavigate,
  onOpenPolicyModal,
  onOpenAdminBuilder,
}: FooterSectionProps) {
  return (
    <footer id="footer" className="bg-[#070708] text-[#D6D3CD] border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-14 border-b border-white/10">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-5">
            <p className="font-display text-3xl font-semibold tracking-[0.22em] text-[#F5F2EB]">
              {config.brandName || 'GLOWORA'}
            </p>
            <p className="text-sm leading-relaxed text-[#A8A29E] max-w-sm">
              {config.aboutText}
            </p>
            <div className="pt-1 space-y-1.5 text-xs text-[#A8A29E]">
              <p className="flex items-center gap-2 text-[#D4AF37]">
                <Mail className="h-3.5 w-3.5" />
                <span>{config.supportEmail}</span>
              </p>
              <p>{config.supportHours}</p>
            </div>
          </div>

          {/* Shop & Explore */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#78716C]">
              Shop
            </h3>
            <ul className="space-y-3 text-sm">
              {config.quickLinks.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => onNavigate(link.target)}
                    className="text-[#D6D3CD] hover:text-[#D4AF37] transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Client Care */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#78716C]">
              Client Care
            </h3>
            <ul className="space-y-3 text-sm">
              {config.supportLinks.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => onOpenPolicyModal(link.modalKey)}
                    className="text-[#D6D3CD] hover:text-[#D4AF37] transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Social */}
          <div className="lg:col-span-3 space-y-7">
            <div className="space-y-4">
              <h3 className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#78716C]">
                Policies
              </h3>
              <ul className="space-y-3 text-sm">
                {config.policyLinks.map((link) => (
                  <li key={link.label}>
                    <button
                      type="button"
                      onClick={() => onOpenPolicyModal(link.modalKey)}
                      className="text-[#D6D3CD] hover:text-[#D4AF37] transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#78716C]">
                Follow
              </h3>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                {config.socialLinks.map((social) => (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#A8A29E] hover:text-[#D4AF37] transition-colors"
                  >
                    <span>{social.platform}</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright, Accepted Payments & Store Admin Portal */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#78716C]">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <p>{config.copyrightText}</p>
            <span aria-hidden="true" className="hidden sm:inline text-[#3F3F46]">
              ·
            </span>
            <button
              type="button"
              onClick={onOpenAdminBuilder}
              className="inline-flex items-center gap-1.5 text-[#78716C] hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span>Store Admin</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5" aria-label="Accepted payment methods">
            <JazzCashLogo compact />
            {['Bank Transfer', 'Cash on Delivery', 'Visa / Mastercard'].map((method) => (
              <span
                key={method}
                className="border border-white/12 bg-[#111113] px-2.5 py-1 text-[11px] text-[#A8A29E]"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
