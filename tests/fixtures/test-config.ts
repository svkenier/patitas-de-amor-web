export const TEST_CONFIG = {
  siteTitlePattern: /.+/i,
  heroHeadlinePattern: /.+/i,
  sampleItem: {
    title: "Item de Prueba E2E",
    description: "Descripción genérica de validación funcional",
    category: "General",
  },
  sampleAnnouncement: {
    title: "Aviso de Prueba E2E",
    description: "Contenido de prueba para el módulo de anuncios",
  },
  endpoints: {
    items: "/api/collections/pets",
    announcements: "/api/collections/announcements",
    authLogin: "/api/auth/login",
    authVerify: "/api/auth/verify",
  },
};
