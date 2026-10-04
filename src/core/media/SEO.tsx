import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
  schemaType?: string;
  noindex?: boolean;
}

export default function SEO({ 
  title, 
  description, 
  image = '/hero-desktop.webp', 
  url, 
  type = 'website',
  schemaType = 'AnimalShelter',
  noindex = false
}: SEOProps) {
  let baseUrl = import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://patitasdeamorbqto.com');
  // Limpiar posible formato Markdown accidental como "[https://...](https://...)"
  baseUrl = baseUrl.replace(/^\[.*\]\((.*)\)$/, '$1');
  const finalUrl = url ? (url.startsWith('http') ? url : `${baseUrl}${url}`) : baseUrl;
  const finalImage = image.startsWith('http') ? image : `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;

  const siteName = import.meta.env.VITE_SITE_NAME || 'Patitas de Amor Bqto';
  const fullTitle = title.includes(siteName) ? title : `${title} · ${siteName}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "name": "Patitas de Amor Barquisimeto",
    "alternateName": siteName,
    "url": baseUrl,
    "logo": `${baseUrl}/favicon.webp`,
    "image": finalImage,
    "description": description,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Barquisimeto",
      "addressRegion": "Lara",
      "addressCountry": "VE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 10.0645,
      "longitude": -69.3569
    },
    "areaServed": "Barquisimeto",
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
      {noindex && <meta name="robots" content="noindex, follow" />}

      {/* Geo-Metatags */}
      <meta name="geo.region" content="VE-K" />
      <meta name="geo.placename" content="Barquisimeto" />
      <meta name="geo.position" content="10.0645;-69.3569" />
      <meta name="ICBM" content="10.0645, -69.3569" />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={finalUrl} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={finalImage} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
