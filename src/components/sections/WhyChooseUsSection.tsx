import { Award, Globe, Headphones, Lock, ShieldCheck } from 'lucide-react';
import type { WhyChooseUsConfig, WhyChooseUsItem } from '../../types/glowora';

interface WhyChooseUsSectionProps {
  config: WhyChooseUsConfig;
}

function renderIcon(key: WhyChooseUsItem['iconKey']) {
  switch (key) {
    case 'quality':
      return <Award className="h-5 w-5 text-[#D4AF37]" strokeWidth={1.4} />;
    case 'authentic':
      return <ShieldCheck className="h-5 w-5 text-[#D4AF37]" strokeWidth={1.4} />;
    case 'secure':
      return <Lock className="h-5 w-5 text-[#D4AF37]" strokeWidth={1.4} />;
    case 'shipping':
      return <Globe className="h-5 w-5 text-[#D4AF37]" strokeWidth={1.4} />;
    case 'support':
    default:
      return <Headphones className="h-5 w-5 text-[#D4AF37]" strokeWidth={1.4} />;
  }
}

export function WhyChooseUsSection({ config }: WhyChooseUsSectionProps) {
  return (
    <section
      id="why_choose_us"
      className="bg-[#0A0A0B] py-16 lg:py-20 border-b border-white/10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#F5F2EB] text-balance">
            {config.heading}
          </h2>
          <p className="text-sm text-[#A8A29E] max-w-md">{config.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border-t border-white/10 pt-8 gap-8">
          {config.pillars.map((pillar) => (
            <div key={pillar.title} className="space-y-3">
              <div>{renderIcon(pillar.iconKey)}</div>
              <h3 className="font-display text-xl font-medium text-[#F5F2EB]">
                {pillar.title}
              </h3>
              <p className="text-xs leading-relaxed text-[#A8A29E]">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
