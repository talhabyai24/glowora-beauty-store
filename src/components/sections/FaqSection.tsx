import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FaqConfig } from '../../types/glowora';

interface FaqSectionProps {
  config: FaqConfig;
}

export function FaqSection({ config }: FaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(config.items[0]?.id || null);

  return (
    <section
      id="faq"
      className="bg-[#0A0A0B] py-16 lg:py-24 border-b border-white/10"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 space-y-2 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#F5F2EB] text-balance">
            {config.heading}
          </h2>
          <p className="text-sm text-[#A8A29E]">{config.subtitle}</p>
        </div>

        <div className="divide-y divide-white/10 border-y border-white/10">
          {config.items.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div key={item.id}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left hover:text-[#D4AF37] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37]"
                >
                  <span className="font-display text-xl font-medium text-[#F5F2EB]">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-[#D4AF37] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="pb-6 text-sm leading-relaxed text-[#A8A29E]">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
