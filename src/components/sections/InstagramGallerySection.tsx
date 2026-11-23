import { ArrowUpRight, Instagram } from 'lucide-react';
import type { InstagramGalleryConfig, InstagramTileConfig } from '../../types/glowora';
import { LuxuryImage } from '../ui/LuxuryImage';

interface InstagramGallerySectionProps {
  config: InstagramGalleryConfig;
  onSelectTile: (tile: InstagramTileConfig) => void;
}

export function InstagramGallerySection({
  config,
  onSelectTile,
}: InstagramGallerySectionProps) {
  return (
    <section
      id="instagram_gallery"
      className="bg-[#0E0E10] py-16 lg:py-24 border-b border-white/10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="space-y-2">
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#F5F2EB] text-balance">
              {config.heading}
            </h2>
            <p className="text-sm text-[#A8A29E]">
              {config.subtitle}{' '}
              <span className="text-[#D4AF37] font-medium">{config.handle}</span>
            </p>
          </div>

          <a
            href={config.profileUrl || 'https://instagram.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start sm:self-auto inline-flex items-center gap-2 text-xs font-medium text-[#D4AF37] hover:text-[#E5C158] transition-colors whitespace-nowrap shrink-0"
          >
            <Instagram className="h-3.5 w-3.5" />
            <span>{config.ctaLabel || 'Follow on Instagram'}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {config.tiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => onSelectTile(tile)}
              className="group relative aspect-square overflow-hidden bg-[#141417] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
            >
              <LuxuryImage
                src={tile.imageUrl}
                alt={tile.caption}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                fallbackLabel={tile.handleTag}
              />
              <div className="absolute inset-0 bg-[#0A0A0B]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                <p className="text-[11px] font-medium text-[#D4AF37]">{tile.handleTag}</p>
                <p className="text-xs text-[#F5F2EB] line-clamp-2 mt-0.5">{tile.caption}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
