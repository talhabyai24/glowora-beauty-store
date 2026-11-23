import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { NewsletterConfig } from '../../types/glowora';

interface NewsletterSectionProps {
  config: NewsletterConfig;
  onSubscribe: (email: string) => Promise<{ subscribed: boolean; alreadySubscribed: boolean }>;
}

export function NewsletterSection({ config, onSubscribe }: NewsletterSectionProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setMessage('');
    try {
      const res = await onSubscribe(email.trim());
      setStatus('success');
      setMessage(
        res.alreadySubscribed
          ? 'You are already subscribed — use code GLOW15 at checkout.'
          : 'Welcome to GLOWORA. Use code GLOW15 for 15% off your first order.'
      );
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Unable to subscribe.');
    }
  };

  return (
    <section
      id="newsletter"
      className="bg-[#111114] py-20 lg:py-24 border-b border-white/10"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#D4AF37]">
          {config.kicker}
        </p>

        <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#F5F2EB] text-balance mx-auto max-w-xl">
          {config.heading}
        </h2>

        <p className="text-sm sm:text-base text-[#A8A29E] max-w-lg mx-auto">
          {config.subtitle}
        </p>

        {status === 'success' ? (
          <div className="mx-auto max-w-md border border-[#D4AF37]/40 bg-[#0A0A0B] px-5 py-4 flex items-center justify-center gap-3 text-sm text-[#F5F2EB]">
            <CheckCircle2 className="h-5 w-5 text-[#D4AF37] shrink-0" />
            <span>{message}</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-md flex-col sm:flex-row gap-3 pt-2"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={config.placeholder || 'Enter your email address'}
              aria-label="Email address"
              className="flex-1 border border-white/20 bg-[#0A0A0B] px-4 py-3 text-sm text-[#F5F2EB] placeholder:text-[#78716C] focus:border-[#D4AF37] focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-[#D4AF37] px-7 py-3 text-xs font-semibold tracking-[0.14em] uppercase text-[#0A0A0B] hover:bg-[#E5C158] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              {status === 'loading' ? 'Joining...' : config.buttonLabel || 'Subscribe'}
            </button>
          </form>
        )}

        {status === 'error' && <p className="text-xs text-red-400">{message}</p>}

        <p className="text-xs text-[#78716C]">{config.promoNote}</p>
      </div>
    </section>
  );
}
