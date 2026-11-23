import { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface LuxuryImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectClassName?: string;
  fallbackLabel?: string;
}

export function LuxuryImage({
  src,
  alt,
  className = '',
  aspectClassName = '',
  fallbackLabel = 'GLOWORA',
}: LuxuryImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#16161A] via-[#121215] to-[#0A0A0B] border border-[#D4AF37]/20 ${aspectClassName} ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="flex flex-col items-center gap-2 px-4 text-center">
          <Sparkles className="h-5 w-5 text-[#D4AF37]/70" strokeWidth={1.5} />
          <span className="font-display text-sm tracking-[0.2em] text-[#D4AF37]/80 uppercase">
            {fallbackLabel}
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${aspectClassName} ${className}`}
      loading="lazy"
    />
  );
}
