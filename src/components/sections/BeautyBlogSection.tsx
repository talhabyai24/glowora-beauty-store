import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { BeautyBlogConfig, BlogArticleConfig } from '../../types/glowora';
import { LuxuryImage } from '../ui/LuxuryImage';

interface BeautyBlogSectionProps {
  config: BeautyBlogConfig;
  onReadArticle: (article: BlogArticleConfig) => void;
}

export function BeautyBlogSection({ config, onReadArticle }: BeautyBlogSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(
    () => [
      'All',
      ...Array.from(new Set(config.articles.map((a) => a.category).filter(Boolean))),
    ],
    [config.articles]
  );

  const filteredArticles = useMemo(
    () =>
      selectedCategory === 'All'
        ? config.articles
        : config.articles.filter((a) => a.category === selectedCategory),
    [config.articles, selectedCategory]
  );

  const leadArticle = selectedCategory === 'All' ? filteredArticles[0] : null;
  const gridArticles = leadArticle ? filteredArticles.slice(1) : filteredArticles;

  return (
    <section
      id="beauty_blog"
      className="bg-[#0A0A0B] py-16 lg:py-24 border-b border-white/10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 space-y-12">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="space-y-2">
            <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#D4AF37]">
              Journal
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#F5F2EB] text-balance">
              {config.heading}
            </h2>
            <p className="text-sm text-[#A8A29E] max-w-xl">{config.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-b border-white/10 pb-2">
            {categories.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`pb-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    active
                      ? 'border-[#D4AF37] text-[#F5F2EB]'
                      : 'border-transparent text-[#A8A29E] hover:text-[#F5F2EB]'
                  }`}
                >
                  {category === 'All' ? 'All' : category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lead Editorial Story */}
        {leadArticle && (
          <article
            onClick={() => onReadArticle(leadArticle)}
            className="group cursor-pointer grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pb-10 border-b border-white/10"
          >
            <div className="lg:col-span-6 aspect-[4/3] w-full overflow-hidden bg-[#141417]">
              <LuxuryImage
                src={leadArticle.imageUrl}
                alt={leadArticle.title}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                fallbackLabel={leadArticle.category}
              />
            </div>

            <div className="lg:col-span-6 space-y-5">
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#A8A29E]">
                <span className="uppercase tracking-[0.14em] text-[#D4AF37]">
                  {leadArticle.category}
                </span>
                <span aria-hidden="true">·</span>
                <span>{leadArticle.publishedDate}</span>
                <span aria-hidden="true">·</span>
                <span>{leadArticle.readTime}</span>
              </div>

              <h3 className="font-display text-3xl sm:text-4xl font-medium leading-tight text-[#F5F2EB] group-hover:text-[#E5C158] transition-colors">
                {leadArticle.title}
              </h3>

              <p className="text-sm sm:text-base leading-relaxed text-[#D6D3CD]">
                {leadArticle.excerpt}
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReadArticle(leadArticle);
                }}
                className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase text-[#D4AF37] hover:text-[#E5C158] transition-colors pt-1"
              >
                <span>Read Article</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>
        )}

        {/* Editorial Grid */}
        {gridArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {gridArticles.map((article) => (
              <article
                key={article.id}
                onClick={() => onReadArticle(article)}
                className="group cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#141417]">
                  <LuxuryImage
                    src={article.imageUrl}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    fallbackLabel={article.category}
                  />
                </div>

                <div className="pt-5 flex flex-1 flex-col justify-between gap-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-[11px] text-[#A8A29E]">
                      <span className="uppercase tracking-[0.12em] text-[#D4AF37]">
                        {article.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{article.publishedDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>{article.readTime}</span>
                    </div>

                    <h3 className="font-display text-2xl font-medium leading-snug text-[#F5F2EB] group-hover:text-[#E5C158] transition-colors">
                      {article.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-[#A8A29E] line-clamp-3">
                      {article.excerpt}
                    </p>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReadArticle(article);
                      }}
                      className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase text-[#D4AF37] hover:text-[#E5C158]"
                    >
                      <span>Read More</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
