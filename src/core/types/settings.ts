export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
}

export interface Settings {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  map_url?: string;
  social_links?: SocialLinks;
}

export const DEFAULT_SETTINGS: Settings = {
  phone: '+1 234 567 8900',
  whatsapp: '12345678900',
  email: 'contacto@patitasdeamor.org',
  address: 'Calle Falsa 123, Ciudad, País',
  map_url: '',
};
