import { z } from 'zod';
import type { BaseRecord } from '../types/record.js';

// Límite de 3MB para cadenas Base64 (~2.2MB binario), evitando agotar memoria en Workers (128MB)
const base64ImageSchema = z.string().max(3_000_000, 'La imagen excede el límite permitido');

// Tipos escalares permitidos para attributes y metadata, acotando longitud y previniendo anidaciones infinitas
const safePrimitiveSchema = z.union([
  z.string().max(5000, 'El valor del atributo no puede exceder 5000 caracteres'),
  z.number(),
  z.boolean(),
]);

export const RecordUpsertSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/, 'El ID solo puede contener caracteres alfanuméricos, guiones y guiones bajos').max(100).optional(),
  title: z.string().min(1, 'El campo title es requerido').max(200, 'El título no puede exceder 200 caracteres').trim(),
  description: z.string().max(10_000, 'La descripción no puede exceder 10000 caracteres').optional(),
  category: z.string().max(100).optional(),
  type: z.string().max(100).optional(),
  status: z.string().max(50).optional(),
  attributes: z.record(z.string().max(100), safePrimitiveSchema).optional(),
  metadata: z.record(z.string().max(100), safePrimitiveSchema).optional(),
  
  // Archivos e imágenes acotados
  main_image_base64: base64ImageSchema.optional(),
  gallery_base64: z.array(base64ImageSchema).max(10, 'Máximo 10 imágenes en galería').optional(),
  gallery_existing: z.array(z.string().max(500)).max(10).optional(),
  main_image_url: z.string().max(500).optional(),
});

export const AnnouncementSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200).trim(),
  content: z.string().max(10_000).optional(),
  date: z.string().max(50).optional(),
  active: z.boolean().optional(),
});

export const SettingsSchema = z.object({
  whatsapp: z.string().max(50).optional(),
  email: z.string().max(150).optional(),
  metadata: z.record(z.string().max(100), safePrimitiveSchema).optional(),
});

export function isRecordPubliclyVisible(record: BaseRecord): boolean {
  if (record.status === 'oculto' || (record as any).hidden === true) return false;
  if (record.attributes?.['hidden'] === true) return false;
  if (record.attributes?.['is_active'] === false) return false;
  return true;
}
