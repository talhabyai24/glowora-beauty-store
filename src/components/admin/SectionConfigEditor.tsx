import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  STUDIO_MEDIA_LIBRARY,
  type AnnouncementBarConfig,
  type BeautyBlogConfig,
  type BrandStoryConfig,
  type CategorySectionConfig,
  type CustomerReviewsConfig,
  type FaqConfig,
  type FeaturedCollectionConfig,
  type FlashSaleConfig,
  type FooterConfig,
  type HeaderConfig,
  type HeroBannerConfig,
  type InstagramGalleryConfig,
  type NewsletterConfig,
  type ProductSectionConfig,
  type PromotionalBannerConfig,
  type StoreSection,
  type WhyChooseUsConfig,
} from '../../types/glowora';

interface SectionConfigEditorProps {
  section: StoreSection;
  onSave: (sectionId: StoreSection['id'], config: Record<string, unknown>, label: string) => Promise<void>;
  onCancel: () => void;
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-[#D4AF37]">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="/src/assets/images/... or https://..."
        className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
      />
      <div className="grid grid-cols-4 gap-2 pt-1">
        {STUDIO_MEDIA_LIBRARY.map((media) => {
          const active = value === media.url;
          return (
            <button
              key={media.url}
              type="button"
              onClick={() => onChange(media.url)}
              title={media.label}
              className={`relative aspect-[4/3] overflow-hidden border transition-all ${
                active ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]' : 'border-white/15 opacity-75 hover:opacity-100'
              }`}
            >
              <img
                src={media.url}
                alt={media.label}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs text-[#A8A29E]">{label}</label>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
        />
      )}
    </div>
  );
}

export function SectionConfigEditor({ section, onSave, onCancel }: SectionConfigEditorProps) {
  const [label, setLabel] = useState(section.label);
  const [draft, setDraft] = useState<Record<string, unknown>>(
    () => JSON.parse(JSON.stringify(section.config)) as Record<string, unknown>
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(section.id, draft, label);
    } finally {
      setSaving(false);
    }
  };

  const renderFields = () => {
    switch (section.id) {
      case 'announcement_bar': {
        const c = draft as unknown as AnnouncementBarConfig;
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#A8A29E]">Announcement Messages</label>
                <button
                  type="button"
                  onClick={() => setDraft({ ...c, messages: [...c.messages, 'New GLOWORA seasonal announcement'] })}
                  className="inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:underline"
                >
                  <Plus className="h-3 w-3" /> Add Message
                </button>
              </div>
              {c.messages.map((msg, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={msg}
                    onChange={(e) => {
                      const next = [...c.messages];
                      next[idx] = e.target.value;
                      setDraft({ ...c, messages: next });
                    }}
                    className="flex-1 border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB]"
                  />
                  {c.messages.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({ ...c, messages: c.messages.filter((_, i) => i !== idx) })
                      }
                      aria-label="Remove message"
                      className="p-2 text-[#78716C] hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <TextField
              label="Action Link Label"
              value={c.ctaText}
              onChange={(v) => setDraft({ ...c, ctaText: v })}
            />
            <TextField
              label="Action Link Target (e.g. #flash_sale)"
              value={c.ctaTarget}
              onChange={(v) => setDraft({ ...c, ctaTarget: v })}
            />
          </div>
        );
      }

      case 'header': {
        const c = draft as unknown as HeaderConfig;
        return (
          <div className="space-y-4">
            <TextField
              label="Brand Wordmark"
              value={c.brandName}
              onChange={(v) => setDraft({ ...c, brandName: v })}
            />
            <TextField
              label="Search Input Placeholder"
              value={c.searchPlaceholder}
              onChange={(v) => setDraft({ ...c, searchPlaceholder: v })}
            />
            <div className="space-y-2">
              <label className="block text-xs text-[#A8A29E]">Navigation Links</label>
              {c.navLinks.map((link, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => {
                      const next = [...c.navLinks];
                      next[idx] = { ...next[idx], label: e.target.value };
                      setDraft({ ...c, navLinks: next });
                    }}
                    placeholder="Label"
                    className="border border-white/15 bg-[#0A0A0B] px-2.5 py-2 text-xs text-[#F5F2EB]"
                  />
                  <input
                    type="text"
                    value={link.target}
                    onChange={(e) => {
                      const next = [...c.navLinks];
                      next[idx] = { ...next[idx], target: e.target.value };
                      setDraft({ ...c, navLinks: next });
                    }}
                    placeholder="#section_id"
                    className="border border-white/15 bg-[#0A0A0B] px-2.5 py-2 text-xs text-[#F5F2EB]"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'hero_banner': {
        const c = draft as unknown as HeroBannerConfig;
        return (
          <div className="space-y-4">
            <TextField label="Kicker" value={c.kicker} onChange={(v) => setDraft({ ...c, kicker: v })} />
            <TextField label="Main Heading" value={c.heading} onChange={(v) => setDraft({ ...c, heading: v })} />
            <TextField label="Subtitle" value={c.subtitle} multiline onChange={(v) => setDraft({ ...c, subtitle: v })} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Primary CTA" value={c.ctaLabel} onChange={(v) => setDraft({ ...c, ctaLabel: v })} />
              <TextField label="CTA Target" value={c.ctaTarget} onChange={(v) => setDraft({ ...c, ctaTarget: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Secondary CTA" value={c.secondaryCtaLabel} onChange={(v) => setDraft({ ...c, secondaryCtaLabel: v })} />
              <TextField label="Secondary Target" value={c.secondaryCtaTarget} onChange={(v) => setDraft({ ...c, secondaryCtaTarget: v })} />
            </div>
            <ImageField
              label="Hero Background Image"
              value={c.backgroundImage}
              onChange={(v) => setDraft({ ...c, backgroundImage: v })}
            />
          </div>
        );
      }

      case 'categories': {
        const c = draft as unknown as CategorySectionConfig;
        return (
          <div className="space-y-4">
            <TextField label="Heading" value={c.heading} onChange={(v) => setDraft({ ...c, heading: v })} />
            <TextField label="Subtitle" value={c.subtitle} onChange={(v) => setDraft({ ...c, subtitle: v })} />
            <div className="space-y-3">
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs font-medium text-[#D4AF37]">Category Cards ({c.items.length})</p>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...c,
                      items: [
                        ...c.items,
                        {
                          name: 'New Category',
                          subtitle: 'Luxury Beauty Essentials',
                          imageUrl: STUDIO_MEDIA_LIBRARY[0].url,
                        },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1 bg-[#D4AF37] px-3 py-1.5 text-xs font-semibold text-[#0A0A0B] hover:bg-[#E5C158]"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Category
                </button>
              </div>
              {c.items.map((item, idx) => (
                <div key={idx} className="border border-white/10 bg-[#141417] p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono-tabular text-[#D4AF37]">
                      Category #{idx + 1}
                    </span>
                    {c.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({ ...c, items: c.items.filter((_, i) => i !== idx) })
                        }
                        aria-label={`Remove ${item.name}`}
                        className="text-[#78716C] hover:text-red-400 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <TextField
                    label="Category Name"
                    value={item.name}
                    onChange={(v) => {
                      const next = [...c.items];
                      next[idx] = { ...next[idx], name: v };
                      setDraft({ ...c, items: next });
                    }}
                  />
                  <TextField
                    label="Card Subtitle"
                    value={item.subtitle}
                    onChange={(v) => {
                      const next = [...c.items];
                      next[idx] = { ...next[idx], subtitle: v };
                      setDraft({ ...c, items: next });
                    }}
                  />
                  <ImageField
                    label="Category Image"
                    value={item.imageUrl}
                    onChange={(v) => {
                      const next = [...c.items];
                      next[idx] = { ...next[idx], imageUrl: v };
                      setDraft({ ...c, items: next });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'featured_products':
      case 'best_sellers':
      case 'new_arrivals': {
        const c = draft as unknown as ProductSectionConfig;
        return (
          <div className="space-y-4">
            <TextField label="Section Heading" value={c.heading} onChange={(v) => setDraft({ ...c, heading: v })} />
            <TextField label="Subtitle" value={c.subtitle} multiline onChange={(v) => setDraft({ ...c, subtitle: v })} />
            <TextField label="Action Button Label" value={c.ctaLabel} onChange={(v) => setDraft({ ...c, ctaLabel: v })} />
            <div>
              <label className="block text-xs text-[#A8A29E] mb-1.5">Maximum Products Shown</label>
              <input
                type="number"
                min={1}
                max={24}
                value={c.maxItems}
                onChange={(e) => setDraft({ ...c, maxItems: Number(e.target.value) || 4 })}
                className="w-28 border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB] font-mono-tabular"
              />
            </div>
            <p className="text-[11px] text-[#A8A29E] border border-white/10 bg-[#141417] p-3">
              Products load dynamically from the GLOWORA SQLite database. Add or edit products in the Products tab.
            </p>
          </div>
        );
      }

      case 'promotional_banner': {
        const c = draft as unknown as PromotionalBannerConfig;
        return (
          <div className="space-y-4">
            <TextField label="Campaign Kicker" value={c.kicker} onChange={(v) => setDraft({ ...c, kicker: v })} />
            <TextField label="Campaign Heading" value={c.heading} onChange={(v) => setDraft({ ...c, heading: v })} />
            <TextField label="Campaign Subtitle" value={c.subtitle} multiline onChange={(v) => setDraft({ ...c, subtitle: v })} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Discount Highlight" value={c.discountText} onChange={(v) => setDraft({ ...c, discountText: v })} />
              <TextField label="Primary CTA Label" value={c.ctaLabel} onChange={(v) => setDraft({ ...c, ctaLabel: v })} />
            </div>
            <ImageField
              label="Campaign Banner Image"
              value={c.backgroundImage}
              onChange={(v) => setDraft({ ...c, backgroundImage: v })}
            />
            <TextField label="Secondary Card Title" value={c.secondaryOfferTitle} onChange={(v) => setDraft({ ...c, secondaryOfferTitle: v })} />
            <TextField label="Secondary Card Subtitle" value={c.secondaryOfferSubtitle} onChange={(v) => setDraft({ ...c, secondaryOfferSubtitle: v })} />
            <ImageField
              label="Secondary Card Image"
              value={c.secondaryOfferImage}
              onChange={(v) => setDraft({ ...c, secondaryOfferImage: v })}
            />
          </div>
        );
      }

      case 'flash_sale': {
        const c = draft as unknown as FlashSaleConfig;
        return (
          <div className="space-y-4">
            <TextField label="Heading" value={c.heading} onChange={(v) => setDraft({ ...c, heading: v })} />
            <TextField label="Subtitle" value={c.subtitle} onChange={(v) => setDraft({ ...c, subtitle: v })} />
            <TextField label="Offer Note" value={c.offerNote} onChange={(v) => setDraft({ ...c, offerNote: v })} />
            <div className="space-y-1.5">
              <label className="block text-xs text-[#A8A29E]">Countdown End Timestamp (ISO)</label>
              <input
                type="text"
                value={c.endTimeIso}
                onChange={(e) => setDraft({ ...c, endTimeIso: e.target.value })}
                className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB] font-mono-tabular"
              />
              <button
                type="button"
                onClick={() =>
                  setDraft({ ...c, endTimeIso: new Date(Date.now() + 48 * 3600 * 1000).toISOString() })
                }
                className="text-[11px] text-[#D4AF37] hover:underline"
              >
                Reset timer to +48 hours from now
              </button>
            </div>
          </div>
        );
      }

      case 'brand_story': {
        const c = draft as unknown as BrandStoryConfig;
        return (
          <div className="space-y-4">
            <TextField label="Kicker" value={c.kicker} onChange={(v) => setDraft({ ...c, kicker: v })} />
            <TextField label="Heading" value={c.heading} onChange={(v) => setDraft({ ...c, heading: v })} />
            <TextField label="Introduction Paragraph" value={c.body} multiline onChange={(v) => setDraft({ ...c, body: v })} />
            <TextField label="Extended Modal Story" value={c.extendedStory} multiline onChange={(v) => setDraft({ ...c, extendedStory: v })} />
            <TextField label="CTA Button Label" value={c.ctaLabel} onChange={(v) => setDraft({ ...c, ctaLabel: v })} />
            <ImageField
              label="Brand Story Image"
              value={c.imageUrl}
              onChange={(v) => setDraft({ ...c, imageUrl: v })}
            />
          </div>
        );
      }

      case 'why_choose_us': {
        const c = draft as unknown as WhyChooseUsConfig;
        return (
          <div className="space-y-4">
            <TextField label="Heading" value={c.heading} onChange={(v) => setDraft({ ...c, heading: v })} />
            <TextField label="Subtitle" value={c.subtitle} onChange={(v) => setDraft({ ...c, subtitle: v })} />
            {c.pillars.map((pillar, idx) => (
              <div key={pillar.iconKey} className="border border-white/10 bg-[#141417] p-3 space-y-2">
                <TextField
                  label={`Pillar ${idx + 1} Title`}
                  value={pillar.title}
                  onChange={(v) => {
                    const next = [...c.pillars];
                    next[idx] = { ...next[idx], title: v };
                    setDraft({ ...c, pillars: next });
                  }}
                />
                <TextField
                  label="Description"
                  value={pillar.description}
                  multiline
                  onChange={(v) => {
                    const next = [...c.pillars];
                    next[idx] = { ...next[idx], description: v };
                    setDraft({ ...c, pillars: next });
                  }}
                />
              </div>
            ))}
          </div>
        );
      }

      case 'featured_collection': {
        const c = draft as unknown as FeaturedCollectionConfig;
        return (
          <div className="space-y-4">
            <TextField label="Heading" value={c.heading} onChange={(v) => setDraft({ ...c, heading: v })} />
            <TextField label="Subtitle" value={c.subtitle} onChange={(v) => setDraft({ ...c, subtitle: v })} />
            {c.collections.map((col, idx) => (
              <div key={idx} className="border border-white/10 bg-[#141417] p-3 space-y-2.5">
                <TextField
                  label={`Collection ${idx + 1} Title`}
                  value={col.title}
                  onChange={(v) => {
                    const next = [...c.collections];
                    next[idx] = { ...next[idx], title: v };
                    setDraft({ ...c, collections: next });
                  }}
                />
                <TextField
                  label="Subtitle"
                  value={col.subtitle}
                  onChange={(v) => {
                    const next = [...c.collections];
                    next[idx] = { ...next[idx], subtitle: v };
                    setDraft({ ...c, collections: next });
                  }}
                />
                <TextField
                  label="CTA Label"
                  value={col.ctaLabel}
                  onChange={(v) => {
                    const next = [...c.collections];
                    next[idx] = { ...next[idx], ctaLabel: v };
                    setDraft({ ...c, collections: next });
                  }}
                />
                <ImageField
                  label="Collection Banner Image"
                  value={col.imageUrl}
                  onChange={(v) => {
                    const next = [...c.collections];
                    next[idx] = { ...next[idx], imageUrl: v };
                    setDraft({ ...c, collections: next });
                  }}
                />
              </div>
            ))}
          </div>
        );
      }

      case 'customer_reviews': {
        const c = draft as unknown as CustomerReviewsConfig;
        return (
          <div className="space-y-4">
            <TextField label="Heading" value={c.heading} onChange={(v) => setDraft({ ...c, heading: v })} />
            <TextField label="Subtitle" value={c.subtitle} onChange={(v) => setDraft({ ...c, subtitle: v })} />
          </div>
        );
      }

      case 'beauty_blog': {
        const c = draft as unknown as BeautyBlogConfig;
        return (
          <div className="space-y-4">
            <TextField label="Heading" value={c.heading} onChange={(v) => setDraft({ ...c, heading: v })} />
            <TextField label="Subtitle" value={c.subtitle} onChange={(v) => setDraft({ ...c, subtitle: v })} />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-medium text-[#D4AF37]">
                Journal Articles ({c.articles.length})
              </span>
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    ...c,
                    articles: [
                      ...c.articles,
                      {
                        id: `art-${Date.now()}`,
                        category: 'Skincare Guide',
                        readTime: '4 min read',
                        publishedDate: 'November 2026',
                        title: 'New Skincare & Beauty Guide',
                        excerpt: 'Brief summary of the skincare routine or ingredient spotlight.',
                        fullContent:
                          'Write the full multi-paragraph article content here. Separate paragraphs with a blank line.',
                        imageUrl: STUDIO_MEDIA_LIBRARY[6].url,
                      },
                    ],
                  })
                }
                className="inline-flex items-center gap-1 bg-[#D4AF37] px-3 py-1.5 text-xs font-semibold text-[#0A0A0B] hover:bg-[#E5C158]"
              >
                <Plus className="h-3.5 w-3.5" /> Write Article
              </button>
            </div>

            {c.articles.map((art, idx) => (
              <div key={art.id} className="border border-white/10 bg-[#141417] p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono-tabular text-[11px] text-[#D4AF37]">
                    Article #{idx + 1}
                  </span>
                  {c.articles.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({ ...c, articles: c.articles.filter((_, i) => i !== idx) })
                      }
                      aria-label={`Delete ${art.title}`}
                      className="text-[#78716C] hover:text-red-400 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <TextField
                  label="Article Title"
                  value={art.title}
                  onChange={(v) => {
                    const next = [...c.articles];
                    next[idx] = { ...next[idx], title: v };
                    setDraft({ ...c, articles: next });
                  }}
                />

                <div className="grid grid-cols-3 gap-2">
                  <TextField
                    label="Category"
                    value={art.category}
                    onChange={(v) => {
                      const next = [...c.articles];
                      next[idx] = { ...next[idx], category: v };
                      setDraft({ ...c, articles: next });
                    }}
                  />
                  <TextField
                    label="Published Date"
                    value={art.publishedDate}
                    onChange={(v) => {
                      const next = [...c.articles];
                      next[idx] = { ...next[idx], publishedDate: v };
                      setDraft({ ...c, articles: next });
                    }}
                  />
                  <TextField
                    label="Read Time"
                    value={art.readTime}
                    onChange={(v) => {
                      const next = [...c.articles];
                      next[idx] = { ...next[idx], readTime: v };
                      setDraft({ ...c, articles: next });
                    }}
                  />
                </div>

                <TextField
                  label="Excerpt"
                  value={art.excerpt}
                  multiline
                  onChange={(v) => {
                    const next = [...c.articles];
                    next[idx] = { ...next[idx], excerpt: v };
                    setDraft({ ...c, articles: next });
                  }}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs text-[#A8A29E]">
                    Full Article Content (separate paragraphs with a blank line)
                  </label>
                  <textarea
                    rows={5}
                    value={art.fullContent}
                    onChange={(e) => {
                      const next = [...c.articles];
                      next[idx] = { ...next[idx], fullContent: e.target.value };
                      setDraft({ ...c, articles: next });
                    }}
                    className="w-full border border-white/15 bg-[#0A0A0B] px-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <ImageField
                  label="Article Image"
                  value={art.imageUrl}
                  onChange={(v) => {
                    const next = [...c.articles];
                    next[idx] = { ...next[idx], imageUrl: v };
                    setDraft({ ...c, articles: next });
                  }}
                />
              </div>
            ))}
          </div>
        );
      }

      case 'instagram_gallery': {
        const c = draft as unknown as InstagramGalleryConfig;
        return (
          <div className="space-y-4">
            <TextField label="Heading" value={c.heading} onChange={(v) => setDraft({ ...c, heading: v })} />
            <TextField label="Subtitle" value={c.subtitle} onChange={(v) => setDraft({ ...c, subtitle: v })} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Handle" value={c.handle} onChange={(v) => setDraft({ ...c, handle: v })} />
              <TextField label="Profile URL" value={c.profileUrl} onChange={(v) => setDraft({ ...c, profileUrl: v })} />
            </div>
            {c.tiles.map((tile, idx) => (
              <div key={tile.id} className="border border-white/10 bg-[#141417] p-3 space-y-2">
                <TextField
                  label={`Tile ${idx + 1} Caption`}
                  value={tile.caption}
                  onChange={(v) => {
                    const next = [...c.tiles];
                    next[idx] = { ...next[idx], caption: v };
                    setDraft({ ...c, tiles: next });
                  }}
                />
                <ImageField
                  label="Gallery Image"
                  value={tile.imageUrl}
                  onChange={(v) => {
                    const next = [...c.tiles];
                    next[idx] = { ...next[idx], imageUrl: v };
                    setDraft({ ...c, tiles: next });
                  }}
                />
              </div>
            ))}
          </div>
        );
      }

      case 'newsletter': {
        const c = draft as unknown as NewsletterConfig;
        return (
          <div className="space-y-4">
            <TextField label="Kicker" value={c.kicker} onChange={(v) => setDraft({ ...c, kicker: v })} />
            <TextField label="Heading" value={c.heading} onChange={(v) => setDraft({ ...c, heading: v })} />
            <TextField label="Subtitle" value={c.subtitle} multiline onChange={(v) => setDraft({ ...c, subtitle: v })} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Button Label" value={c.buttonLabel} onChange={(v) => setDraft({ ...c, buttonLabel: v })} />
              <TextField label="Input Placeholder" value={c.placeholder} onChange={(v) => setDraft({ ...c, placeholder: v })} />
            </div>
            <TextField label="Promotional Note" value={c.promoNote} onChange={(v) => setDraft({ ...c, promoNote: v })} />
          </div>
        );
      }

      case 'faq': {
        const c = draft as unknown as FaqConfig;
        return (
          <div className="space-y-4">
            <TextField label="Heading" value={c.heading} onChange={(v) => setDraft({ ...c, heading: v })} />
            <TextField label="Subtitle" value={c.subtitle} onChange={(v) => setDraft({ ...c, subtitle: v })} />
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-medium text-[#D4AF37]">Questions</span>
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    ...c,
                    items: [
                      ...c.items,
                      { id: `faq-${Date.now()}`, question: 'New Question', answer: 'Provide answer details.' },
                    ],
                  })
                }
                className="inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:underline"
              >
                <Plus className="h-3 w-3" /> Add FAQ
              </button>
            </div>
            {c.items.map((faq, idx) => (
              <div key={faq.id} className="border border-white/10 bg-[#141417] p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#A8A29E]">FAQ {idx + 1}</span>
                  {c.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setDraft({ ...c, items: c.items.filter((_, i) => i !== idx) })}
                      className="text-[#78716C] hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <TextField
                  label="Question"
                  value={faq.question}
                  onChange={(v) => {
                    const next = [...c.items];
                    next[idx] = { ...next[idx], question: v };
                    setDraft({ ...c, items: next });
                  }}
                />
                <TextField
                  label="Answer"
                  value={faq.answer}
                  multiline
                  onChange={(v) => {
                    const next = [...c.items];
                    next[idx] = { ...next[idx], answer: v };
                    setDraft({ ...c, items: next });
                  }}
                />
              </div>
            ))}
          </div>
        );
      }

      case 'footer': {
        const c = draft as unknown as FooterConfig;
        return (
          <div className="space-y-4">
            <TextField label="Brand Name" value={c.brandName} onChange={(v) => setDraft({ ...c, brandName: v })} />
            <TextField label="About GLOWORA" value={c.aboutText} multiline onChange={(v) => setDraft({ ...c, aboutText: v })} />
            <TextField label="Support Email" value={c.supportEmail} onChange={(v) => setDraft({ ...c, supportEmail: v })} />
            <TextField label="Support Hours" value={c.supportHours} onChange={(v) => setDraft({ ...c, supportHours: v })} />
            <TextField label="Copyright Text" value={c.copyrightText} onChange={(v) => setDraft({ ...c, copyrightText: v })} />
          </div>
        );
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <TextField label="Builder Display Label" value={label} onChange={setLabel} />
        <div className="border-t border-white/10 pt-4">{renderFields()}</div>
      </div>

      <div className="border-t border-white/10 bg-[#141417] p-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs text-[#A8A29E] hover:text-[#F5F2EB]"
        >
          Back to List
        </button>
        <button
          type="submit"
          disabled={saving}
          className="bg-[#D4AF37] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0A0A0B] hover:bg-[#E5C158] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Section'}
        </button>
      </div>
    </form>
  );
}
