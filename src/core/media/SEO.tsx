import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
  schemaType?: string;
}

export default function SEO({ 
  title, 
  description, 
  image = '/hero-desktop.webp', 
  url, 
  type = 'website',
  schemaType = 'Organization'
}: SEOProps) {
  let baseUrl = import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://boilerplate.local');
  // Limpiar posible formato Markdown accidental como "[https://...](https://...)"
  baseUrl = baseUrl.replace(/^\[.*\]\((.*)\)$/, '$1');
  const finalUrl = url ? (url.startsWith('http') ? url : `${baseUrl}${url}`) : baseUrl;

  const siteName = import.meta.env.VITE_SITE_NAME || 'Platform Boilerplate';
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "name": siteName,
    "url": baseUrl,
    "logo": `${baseUrl}/favicon.webp`,
    "image": `${baseUrl}/hero-desktop.webp`,
    "description": description,
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service"
    }
  };

  return (
    <Helmet>
      {/* Estándar */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={finalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${baseUrl}${image}`} />
      <meta property="og:url" content={finalUrl} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${baseUrl}${image}`} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
