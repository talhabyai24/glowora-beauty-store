import { useEffect } from 'react';
import type { BeautyBlogConfig, FaqConfig, Product, SeoSettings, StoreSection } from '../../types/glowora';

interface SeoManagerProps {
  seoSettings: SeoSettings;
  products: Product[];
  sections: StoreSection[];
}

function upsertMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function SeoManager({ seoSettings, products, sections }: SeoManagerProps) {
  useEffect(() => {
    const canonicalUrl = `${window.location.origin}${window.location.pathname}`;
    const absoluteOgImage = seoSettings.ogImage.startsWith('http')
      ? seoSettings.ogImage
      : `${window.location.origin}${seoSettings.ogImage.startsWith('/') ? '' : '/'}${seoSettings.ogImage}`;

    document.title = seoSettings.metaTitle;
    upsertMetaTag('name', 'description', seoSettings.metaDescription);
    upsertMetaTag('name', 'keywords', seoSettings.keywords);
    upsertMetaTag('property', 'og:title', seoSettings.metaTitle);
    upsertMetaTag('property', 'og:description', seoSettings.metaDescription);
    upsertMetaTag('property', 'og:url', canonicalUrl);
    upsertMetaTag('property', 'og:image', absoluteOgImage);
    upsertMetaTag('name', 'twitter:title', seoSettings.metaTitle);
    upsertMetaTag('name', 'twitter:description', seoSettings.metaDescription);
    upsertMetaTag('name', 'twitter:image', absoluteOgImage);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    const faqSection = sections.find((s) => s.id === 'faq' && s.enabled);
    const faqItems = faqSection ? (faqSection.config as FaqConfig).items : [];
    const blogSection = sections.find((s) => s.id === 'beauty_blog' && s.enabled);
    const blogArticles = blogSection ? (blogSection.config as BeautyBlogConfig).articles : [];

    const structuredData: Record<string, unknown>[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'GLOWORA',
        url: canonicalUrl,
        logo: absoluteOgImage,
        description: seoSettings.metaDescription,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'GLOWORA',
        url: canonicalUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${canonicalUrl}?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'GLOWORA Signature Beauty Catalog',
        itemListElement: products.slice(0, 12).map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: product.name,
            description: product.description,
            category: product.category,
            image: product.imageUrl.startsWith('http')
              ? product.imageUrl
              : `${window.location.origin}${product.imageUrl}`,
            offers: {
              '@type': 'Offer',
              priceCurrency: 'USD',
              price: product.price.toFixed(2),
              availability:
                product.stock > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: product.rating.toFixed(1),
              reviewCount: Math.max(1, product.reviewCount),
            },
          },
        })),
      },
    ];

    if (blogArticles.length > 0) {
      structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'GLOWORA The Beauty Journal',
        url: `${canonicalUrl}#beauty_blog`,
        blogPost: blogArticles.map((art) => ({
          '@type': 'BlogPosting',
          headline: art.title,
          description: art.excerpt,
          articleSection: art.category,
          image: art.imageUrl.startsWith('http')
            ? art.imageUrl
            : `${window.location.origin}${art.imageUrl}`,
          author: {
            '@type': 'Organization',
            name: 'GLOWORA Formulation & Editorial Lab',
          },
        })),
      });
    }

    if (faqItems.length > 0) {
      structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      });
    }

    let script = document.getElementById('glowora-jsonld') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'glowora-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
  }, [seoSettings, products, sections]);

  return null;
}
