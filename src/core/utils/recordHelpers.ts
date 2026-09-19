export type AnnouncementType = 'vacunacion' | 'esterilizacion' | 'adopcion' | 'evento' | 'general' | 'perdida' | string;

export const TYPE_COLORS: Record<string, string> = {
  vacunacion: '#16A34A',
  esterilizacion: '#0D9488',
  adopcion: '#D97706',
  evento: '#2563EB',
  general: '#7C3AED',
  perdida: '#E0533C',
};

export const TYPE_TEXT_COLORS: Record<string, string> = {
  vacunacion: '#FFFFFF',
  esterilizacion: '#FFFFFF',
  adopcion: '#1E293B',
  evento: '#FFFFFF',
  general: '#FFFFFF',
  perdida: '#FFFFFF',
};

export const TYPE_LABELS: Record<string, string> = {
  vacunacion: 'Jornada de Vacunación',
  esterilizacion: 'Jornada de Esterilización',
  adopcion: 'Jornada de Adopción',
  evento: 'Evento Especial',
  general: 'General',
  perdida: 'Mascota Perdida',
};
