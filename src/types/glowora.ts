export type ProductCategory = string;

export const DEFAULT_CATEGORIES = [
  'Skincare',
  'Makeup',
  'Haircare',
  'Body Care',
  'Fragrances',
  'Beauty Tools',
  'Gift Sets',
  'Bath & Spa',
] as const;

export type PaymentMethod = 'jazzcash' | 'bank_transfer' | 'cod' | 'card';

export interface PaymentSettings {
  jazzcashEnabled: boolean;
  jazzcashDisplayName: string;
  jazzcashInstructions: string;
  jazzcashGatewayConfigured?: boolean;
  bankEnabled: boolean;
  bankName: string;
  bankAccountTitle: string;
  bankAccountNumber: string;
  bankIban: string;
  bankSwiftCode: string;
  bankInstructions: string;
  codEnabled: boolean;
  cardEnabled: boolean;
}

export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogImage: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  collectionTag: string;
  description: string;
  ingredients: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  stock: number;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  isFlashSale: boolean;
  badgeText: string;
  createdAt: string;
}

export interface Review {
  id: string;
  authorName: string;
  authorEmail?: string;
  authorRole: string;
  avatarUrl: string;
  rating: number;
  productName: string;
  quote: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  postalCode: string;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  paymentStatus: string;
  paymentDate: string;
  receiptFilename: string;
  rejectionReason: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
  }>;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: string;
  createdAt: string;
}

export interface PaymentTransactionLog {
  id: string;
  orderId: string;
  txnRefNo: string;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  status: string;
  gatewayCode: string;
  message: string;
  actor: string;
  createdAt: string;
}

export type SectionId =
  | 'announcement_bar'
  | 'header'
  | 'hero_banner'
  | 'categories'
  | 'featured_products'
  | 'best_sellers'
  | 'new_arrivals'
  | 'promotional_banner'
  | 'flash_sale'
  | 'brand_story'
  | 'why_choose_us'
  | 'featured_collection'
  | 'customer_reviews'
  | 'beauty_blog'
  | 'instagram_gallery'
  | 'newsletter'
  | 'faq'
  | 'footer';

export interface AnnouncementBarConfig {
  messages: string[];
  ctaText: string;
  ctaTarget: string;
}

export interface HeaderConfig {
  brandName: string;
  navLinks: Array<{ label: string; target: string }>;
  searchPlaceholder: string;
}

export interface HeroBannerConfig {
  kicker: string;
  heading: string;
  subtitle: string;
  ctaLabel: string;
  ctaTarget: string;
  secondaryCtaLabel: string;
  secondaryCtaTarget: string;
  backgroundImage: string;
}

export interface CategoryItemConfig {
  name: ProductCategory;
  subtitle: string;
  imageUrl: string;
}

export interface CategorySectionConfig {
  heading: string;
  subtitle: string;
  items: CategoryItemConfig[];
}

export interface ProductSectionConfig {
  heading: string;
  subtitle: string;
  ctaLabel: string;
  maxItems: number;
}

export interface PromotionalBannerConfig {
  kicker: string;
  heading: string;
  subtitle: string;
  discountText: string;
  ctaLabel: string;
  ctaFilterCategory: string;
  backgroundImage: string;
  secondaryOfferTitle: string;
  secondaryOfferSubtitle: string;
  secondaryOfferCta: string;
  secondaryOfferImage: string;
}

export interface FlashSaleConfig {
  heading: string;
  subtitle: string;
  offerNote: string;
  endTimeIso: string;
  ctaLabel: string;
}

export interface BrandStoryConfig {
  kicker: string;
  heading: string;
  body: string;
  extendedStory: string;
  ctaLabel: string;
  imageUrl: string;
  highlights: Array<{ label: string; value: string }>;
}

export interface WhyChooseUsItem {
  iconKey: 'quality' | 'authentic' | 'secure' | 'shipping' | 'support';
  title: string;
  description: string;
}

export interface WhyChooseUsConfig {
  heading: string;
  subtitle: string;
  pillars: WhyChooseUsItem[];
}

export interface CollectionCardConfig {
  title: string;
  subtitle: string;
  filterCategory: string;
  ctaLabel: string;
  imageUrl: string;
}

export interface FeaturedCollectionConfig {
  heading: string;
  subtitle: string;
  collections: CollectionCardConfig[];
}

export interface CustomerReviewsConfig {
  heading: string;
  subtitle: string;
}

export interface BlogArticleConfig {
  id: string;
  category: string;
  readTime: string;
  title: string;
  excerpt: string;
  fullContent: string;
  imageUrl: string;
  publishedDate: string;
}

export interface BeautyBlogConfig {
  heading: string;
  subtitle: string;
  articles: BlogArticleConfig[];
}

export interface InstagramTileConfig {
  id: string;
  imageUrl: string;
  caption: string;
  handleTag: string;
}

export interface InstagramGalleryConfig {
  heading: string;
  subtitle: string;
  handle: string;
  profileUrl: string;
  ctaLabel: string;
  tiles: InstagramTileConfig[];
}

export interface NewsletterConfig {
  kicker: string;
  heading: string;
  subtitle: string;
  placeholder: string;
  buttonLabel: string;
  promoNote: string;
}

export interface FaqItemConfig {
  id: string;
  question: string;
  answer: string;
}

export interface FaqConfig {
  heading: string;
  subtitle: string;
  items: FaqItemConfig[];
}

export interface FooterConfig {
  brandName: string;
  aboutText: string;
  supportEmail: string;
  supportHours: string;
  quickLinks: Array<{ label: string; target: string }>;
  supportLinks: Array<{ label: string; modalKey: string }>;
  policyLinks: Array<{ label: string; modalKey: string }>;
  socialLinks: Array<{ platform: string; url: string }>;
  copyrightText: string;
}

export type SectionConfigMap = {
  announcement_bar: AnnouncementBarConfig;
  header: HeaderConfig;
  hero_banner: HeroBannerConfig;
  categories: CategorySectionConfig;
  featured_products: ProductSectionConfig;
  best_sellers: ProductSectionConfig;
  new_arrivals: ProductSectionConfig;
  promotional_banner: PromotionalBannerConfig;
  flash_sale: FlashSaleConfig;
  brand_story: BrandStoryConfig;
  why_choose_us: WhyChooseUsConfig;
  featured_collection: FeaturedCollectionConfig;
  customer_reviews: CustomerReviewsConfig;
  beauty_blog: BeautyBlogConfig;
  instagram_gallery: InstagramGalleryConfig;
  newsletter: NewsletterConfig;
  faq: FaqConfig;
  footer: FooterConfig;
};

export interface StoreSection<T extends SectionId = SectionId> {
  id: T;
  type: T;
  label: string;
  enabled: boolean;
  sortOrder: number;
  config: SectionConfigMap[T];
  updatedAt: string;
}

export const STUDIO_MEDIA_LIBRARY: Array<{ label: string; url: string }> = [
  {
    label: 'Campaign Hero Banner',
    url: '/src/assets/images/hero_luxury_beauty_1795461007331.jpg',
  },
  {
    label: '24K Gold Peptide Face Serum',
    url: '/src/assets/images/product_elixir_serum_1795461007227.jpg',
  },
  {
    label: 'Velvet Matte Lipstick — Rosewood',
    url: '/src/assets/images/product_velvet_lipstick_1795461006845.jpg',
  },
  {
    label: 'Ceramide Barrier Night Cream',
    url: '/src/assets/images/product_silk_cream_1795461008114.jpg',
  },
  {
    label: 'Ambre Nocturne Extrait de Parfum',
    url: '/src/assets/images/product_oud_perfume_1795461007279.jpg',
  },
  {
    label: 'Cold-Pressed Argan Hair Oil',
    url: '/src/assets/images/product_hair_oil_1795461008531.jpg',
  },
  {
    label: 'Black Camellia Cleansing Balm',
    url: '/src/assets/images/product_cleansing_balm_1795463363121.jpg',
  },
  {
    label: 'Saffron & Neroli Dry Body Oil',
    url: '/src/assets/images/product_body_oil_1795463362995.jpg',
  },
  {
    label: 'Golden Rose Botanical Lip Oil',
    url: '/src/assets/images/product_lip_oil_1795463363551.jpg',
  },
  {
    label: 'Luminous Serum Skin Tint',
    url: '/src/assets/images/product_skin_tint_1795463363743.jpg',
  },
  {
    label: 'Sculpted Brushed Brass Gua Sha',
    url: '/src/assets/images/product_gua_sha_1795463364162.jpg',
  },
  {
    label: 'Rose Oud & Cardamom Hair Mist',
    url: '/src/assets/images/product_hair_mist_1795463364808.jpg',
  },
  {
    label: 'Mineral Eucalyptus & Kelp Bath Salts',
    url: '/src/assets/images/product_bath_soak_1795463364918.jpg',
  },
  {
    label: 'Evening Radiance 3-Piece Gift Set',
    url: '/src/assets/images/product_gift_coffret_1795463365613.jpg',
  },
  {
    label: 'Formulation Laboratory & Botanicals',
    url: '/src/assets/images/brand_story_atelier_1795461009918.jpg',
  },
  {
    label: 'Editorial Complexion Campaign',
    url: '/src/assets/images/editorial_beauty_portrait_1795461009923.jpg',
  },
];
