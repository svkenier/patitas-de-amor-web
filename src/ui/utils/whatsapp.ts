/**
 * Generador Agnóstico de URLs de WhatsApp.
 * Este módulo centraliza la construcción de enlaces seguros hacia la API de WhatsApp (wa.me).
 * No contiene reglas de negocio ni textos estáticos; todo el contenido se inyecta desde la capa de configuración.
 */
import { WHATSAPP_TEMPLATES, type WhatsAppAction } from '@/config/whatsapp.config';

/** URL base de la API de WhatsApp. */
const WA_BASE  = 'https://wa.me';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface WhatsAppPetParams {
  /** Nombre o título de la mascota o elemento (producto, servicio, registro). */
  petName: string;
  /** Identificador único en la base de datos (ej: "record-1718293049"). */
  petId: string;
  /** URL absoluta de la vista de detalle. Si se omite, se construye usando window.location.origin. */
  fichaUrl?: string;
}

// ─── Función interna ──────────────────────────────────────────────────────────

/** Construye la URL final de WhatsApp aplicando codificación URI segura al mensaje. */
function buildWaUrl(phone: string, message: string): string {
  if (!phone) {
    console.warn('[whatsapp.ts] El número de teléfono de destino no está configurado.');
    return '#';
  }
  return `${WA_BASE}/${phone}?text=${encodeURIComponent(message)}`;
}

// ─── Función Genérica Centralizada ────────────────────────────────────────────

/**
 * Genera un enlace de WhatsApp dinámicamente utilizando una plantilla de la configuración.
 * 
 * @param actionKey Clave de la acción (item, generic, emergency, etc.) definida en whatsapp.config.ts
 * @param variables Diccionario de variables (Record<string, string>) a reemplazar en la plantilla.
 *                  La función es 100% flexible: iterará sobre cada llave de este objeto y buscará 
 *                  su equivalente `{llave}` en el texto para reemplazarlo globalmente mediante Regex.
 * @param overridePhone Número de teléfono de destino (inyectado dinámicamente por la UI).
 */
export function getWhatsAppUrl(
  actionKey: WhatsAppAction, 
  variables: Record<string, string> = {}, 
  overridePhone: string
): string {
  let message = WHATSAPP_TEMPLATES[actionKey] as string;

  // Reemplazo dinámico y universal de variables usando Expresiones Regulares
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    message = message.replace(regex, value);
  }

  return buildWaUrl(overridePhone, message);
}

// ─── Wrappers de Compatibilidad para la UI ────────────────────────────────────
// Estas funciones actúan como envoltorios (wrappers) delgados para no romper los componentes visuales existentes.
// Traducen firmas de llamadas específicas a la función genérica subyacente.

/**
 * Genera el enlace de WhatsApp para solicitar más información sobre una mascota.
 */
export function getPetUrl(phone: string, params: WhatsAppPetParams): string {
  const fichaUrl = params.fichaUrl ?? `${window.location.origin}/mascotas/${params.petId}`;
  const title = params.petName ? params.petName.charAt(0).toUpperCase() + params.petName.slice(1) : '';
  
  return getWhatsAppUrl('item', { title, id: params.petId, fichaUrl }, phone);
}

/**
 * Genera el enlace de WhatsApp para información de contacto genérica.
 */
export function getGenericInfoUrl(phone: string): string {
  return getWhatsAppUrl('generic', {}, phone);
}

/**
 * Genera el enlace de WhatsApp para soporte técnico urgente o incidencias.
 */
export function getEmergencyUrl(phone: string): string {
  return getWhatsAppUrl('emergency', {}, phone);
}

/**
 * Genera el enlace de WhatsApp para alianzas, patrocinios o ventas corporativas.
 */
export function getDonationUrl(phone: string): string {
  return getWhatsAppUrl('donation', {}, phone);
}

/**
 * Genera el enlace de WhatsApp para reclutamiento o integraciones al equipo.
 */
export function getVolunteerUrl(phone: string): string {
  return getWhatsAppUrl('volunteer', {}, phone);
}

// ─── Utilidad ─────────────────────────────────────────────────────────────────

/**
 * Abre de forma segura el canal de WhatsApp en una nueva pestaña del navegador.
 */
export function openWhatsApp(url: string): void {
  if (url && url !== '#') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
