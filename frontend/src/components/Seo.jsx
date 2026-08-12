import { useEffect } from 'react';
import { buildCanonicalUrl, DEFAULT_OG_IMAGE, SITE_NAME } from '../utils/seo';

const ensureMetaTag = (selector, attributes) => {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement('meta');
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      tag.setAttribute(key, value);
    }
  });

  return tag;
};

const ensureLinkTag = (selector, attributes) => {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement('link');
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      tag.setAttribute(key, value);
    }
  });

  return tag;
};

const ensureStructuredDataTag = () => {
  let tag = document.head.querySelector('#seo-structured-data');

  if (!tag) {
    tag = document.createElement('script');
    tag.id = 'seo-structured-data';
    tag.type = 'application/ld+json';
    document.head.appendChild(tag);
  }

  return tag;
};

export const Seo = ({
  title,
  description,
  path = '/',
  type = 'website',
  image = DEFAULT_OG_IMAGE,
  keywords,
  noIndex = false,
  structuredData
}) => {
  useEffect(() => {
    const canonicalUrl = buildCanonicalUrl(path);
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

    document.title = fullTitle;

    ensureMetaTag('meta[name="description"]', {
      name: 'description',
      content: description
    });

    ensureMetaTag('meta[name="robots"]', {
      name: 'robots',
      content: noIndex ? 'noindex, nofollow' : 'index, follow'
    });

    ensureMetaTag('meta[name="author"]', {
      name: 'author',
      content: SITE_NAME
    });

    if (keywords) {
      ensureMetaTag('meta[name="keywords"]', {
        name: 'keywords',
        content: keywords
      });
    } else {
      const keywordsTag = document.head.querySelector('meta[name="keywords"]');
      if (keywordsTag) {
        keywordsTag.remove();
      }
    }

    ensureLinkTag('link[rel="canonical"]', {
      rel: 'canonical',
      href: canonicalUrl
    });

    ensureMetaTag('meta[property="og:title"]', {
      property: 'og:title',
      content: fullTitle
    });

    ensureMetaTag('meta[property="og:description"]', {
      property: 'og:description',
      content: description
    });

    ensureMetaTag('meta[property="og:type"]', {
      property: 'og:type',
      content: type
    });

    ensureMetaTag('meta[property="og:url"]', {
      property: 'og:url',
      content: canonicalUrl
    });

    ensureMetaTag('meta[property="og:site_name"]', {
      property: 'og:site_name',
      content: SITE_NAME
    });

    ensureMetaTag('meta[property="og:image"]', {
      property: 'og:image',
      content: image
    });

    ensureMetaTag('meta[property="og:locale"]', {
      property: 'og:locale',
      content: 'en_IN'
    });

    ensureMetaTag('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: 'summary'
    });

    ensureMetaTag('meta[name="twitter:title"]', {
      name: 'twitter:title',
      content: fullTitle
    });

    ensureMetaTag('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: description
    });

    ensureMetaTag('meta[name="twitter:image"]', {
      name: 'twitter:image',
      content: image
    });

    const structuredDataTag = ensureStructuredDataTag();
    if (structuredData) {
      const payload = Array.isArray(structuredData) ? structuredData : [structuredData];
      structuredDataTag.textContent = JSON.stringify(payload);
    } else {
      structuredDataTag.textContent = '';
    }
  }, [description, image, keywords, noIndex, path, structuredData, title]);

  return null;
};
