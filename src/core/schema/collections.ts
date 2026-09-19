import { z } from 'zod';

export const RecordUpsertSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'El campo title es requerido').trim(),
  description: z.string().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  attributes: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  
  // Archivos e imágenes
  main_image_base64: z.string().optional(),
  gallery_base64: z.array(z.string()).optional(),
  gallery_existing: z.array(z.string()).optional(),
  main_image_url: z.string().optional(),
});

export const AnnouncementSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).trim(),
  content: z.string().optional(),
  date: z.string().optional(),
  active: z.boolean().optional(),
});

export const SettingsSchema = z.object({
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});
