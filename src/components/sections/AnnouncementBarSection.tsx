import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { AnnouncementBarConfig } from '../../types/glowora';

interface AnnouncementBarSectionProps {
  config: AnnouncementBarConfig;
  dismissed: boolean;
  onDismiss: () => void;
  onNavigate: (target: string) => void;
}

export function AnnouncementBarSection({
  config,
  dismissed,
  onDismiss,
  onNavigate,
}: AnnouncementBarSectionProps) {
  const [index, setIndex] = useState(0);
  const messages = config.messages.length > 0 ? config.messages : ['Complimentary shipping on orders over $150'];

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [messages.length]);

  if (dismissed) return null;

  const activeMessage = messages[index % messages.length];

  return (
    <div
      id="announcement_bar"
      className="relative bg-[#0E0E10] border-b border-[#D4AF37]/25 text-[#F5F2EB] px-4 py-2 text-xs"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="hidden sm:flex items-center gap-1">
          {messages.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setIndex((prev) => (prev - 1 + messages.length) % messages.length)}
                aria-label="Previous announcement"
                className="p-1 text-[#A8A29E] hover:text-[#D4AF37] transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIndex((prev) => (prev + 1) % messages.length)}
                aria-label="Next announcement"
                className="p-1 text-[#A8A29E] hover:text-[#D4AF37] transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        <div className="flex flex-1 items-center justify-center gap-3 text-center truncate">
          <span className="truncate text-[#E7E2D8]">{activeMessage}</span>
          {config.ctaText && (
            <button
              type="button"
              onClick={() => onNavigate(config.ctaTarget || '#flash_sale')}
              className="whitespace-nowrap shrink-0 font-semibold text-[#D4AF37] underline underline-offset-4 hover:text-[#E5C158] transition-colors"
            >
              {config.ctaText}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close announcement bar"
          className="flex h-6 w-6 shrink-0 items-center justify-center text-[#A8A29E] hover:text-[#F5F2EB] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
