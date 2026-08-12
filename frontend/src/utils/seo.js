export const SITE_URL = 'https://www.erepaircafe.com';
export const SITE_NAME = 'erepaircafe';
export const SUPPORT_EMAIL = 'support@erepaircafe.com';
export const SUPPORT_PHONE = '+91-1800-123-4567';
export const OFFICE_ADDRESS_LABEL = '80 Feet Road, Rabindranath Tagore Nagar Main Rd, Matadahalli, Ganganagar, Bengaluru, Karnataka 560032';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/favicon.svg`;

const OFFICE_ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: '80 Feet Road, Rabindranath Tagore Nagar Main Rd, Matadahalli, Ganganagar',
  addressLocality: 'Bengaluru',
  addressRegion: 'Karnataka',
  postalCode: '560032',
  addressCountry: 'IN'
};

const SAME_AS = [
  'https://x.com/ErepairCafe',
  'https://www.linkedin.com/company/erepaircafe',
  'https://www.instagram.com/erepaircafe',
  'https://www.facebook.com/erepaircafe',
  'https://www.youtube.com/@erepaircafe',
  'https://www.trustpilot.com/review/erepaircafe.com'
];

export const buildCanonicalUrl = (path = '/') => {
  if (!path || path === '/') {
    return SITE_URL;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`.replace(/\/+$/, '');
};

export const buildBreadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: buildCanonicalUrl(item.path)
  }))
});

export const buildLocalBusinessSchema = (path = '/') => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: SITE_NAME,
  url: buildCanonicalUrl(path),
  image: DEFAULT_OG_IMAGE,
  logo: DEFAULT_OG_IMAGE,
  email: SUPPORT_EMAIL,
  telephone: SUPPORT_PHONE,
  address: OFFICE_ADDRESS,
  areaServed: 'Bengaluru',
  sameAs: SAME_AS,
  priceRange: '$$'
});

export const buildWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: 'en-IN'
});

export const buildFaqSchema = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.a
    }
  }))
});

export const buildServiceSchema = ({ name, description, path }) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: name,
  name,
  description,
  provider: {
    '@type': 'LocalBusiness',
    name: SITE_NAME,
    url: SITE_URL
  },
  areaServed: {
    '@type': 'City',
    name: 'Bengaluru'
  },
  url: buildCanonicalUrl(path)
});
