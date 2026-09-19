/**
 * Optimizador de imágenes en el cliente usando HTML5 Canvas.
 *
 * Especificaciones (Rules.md §⚙️ Gestión de Imágenes):
 * - Formato de salida: exclusivamente `image/webp`.
 * - Ancho máximo: 1200 px (proporcional, sin distorsión).
 * - Calidad de compresión: entre 0.75 y 0.85.
 * - Peso objetivo: 80 KB – 150 KB por foto.
 * - Sin dependencias externas: únicamente Canvas API nativa del navegador.
 */

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_WIDTH_PX   = 700;
const WEBP_QUALITY   = 0.80; // 0.75 – 0.85 según reglas
const OUTPUT_FORMAT  = 'image/webp' as const;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface OptimizeResult {
  /** Blob WebP listo para enviar al backend. */
  blob: Blob;
  /** Tamaño final en bytes. */
  sizeBytes: number;
  /** Ancho final en píxeles. */
  width: number;
  /** Alto final en píxeles. */
  height: number;
  /** URL de objeto temporal para previsualización (revocar con URL.revokeObjectURL). */
  previewUrl: string;
}

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Redimensiona y convierte un `File` de imagen a WebP usando Canvas.
 *
 * @param file    - Archivo de imagen original (cualquier formato aceptado por `<img>`).
 * @param quality - Calidad WebP (0 – 1). Por defecto: 0.80.
 * @param maxWidth - Ancho máximo en px. Por defecto: 1200.
 * @returns       - Promesa que resuelve con el resultado optimizado.
 *
 * @example
 * const result = await optimizeImage(file);
 * console.log(`${(result.sizeBytes / 1024).toFixed(1)} KB`);
 */
export async function optimizeImage(
  file: File,
  quality: number = WEBP_QUALITY,
  maxWidth: number = MAX_WIDTH_PX,
): Promise<OptimizeResult> {
  return new Promise((resolve, reject) => {
    // 1. Crear una URL temporal para cargar el archivo en un <img>.
    const objectUrl = URL.createObjectURL(file);
    const img       = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl); // liberar memoria inmediatamente

      // 2. Calcular dimensiones manteniendo la proporción.
      const scale   = img.width > maxWidth ? maxWidth / img.width : 1;
      const width   = Math.round(img.width  * scale);
      const height  = Math.round(img.height * scale);

      // 3. Dibujar en canvas.
      const canvas  = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto 2D del canvas.'));
        return;
      }

      // Activar suavizado de alta calidad para escalado.
      ctx.imageSmoothingEnabled  = true;
      ctx.imageSmoothingQuality  = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // 4. Exportar a WebP.
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas.toBlob devolvió null. Formato no soportado.'));
            return;
          }
          const previewUrl = URL.createObjectURL(blob);
          resolve({
            blob,
            sizeBytes: blob.size,
            width,
            height,
            previewUrl,
          });
        },
        OUTPUT_FORMAT,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`No se pudo cargar la imagen: ${file.name}`));
    };

    img.src = objectUrl;
  });
}

// ─── Optimización en lote ─────────────────────────────────────────────────────

/**
 * Convierte múltiples archivos de imagen a WebP en paralelo.
 *
 * @param files   - Array de archivos de imagen.
 * @param quality - Calidad WebP compartida.
 * @returns       - Array de resultados en el mismo orden que los archivos de entrada.
 */
export async function optimizeImages(
  files: File[],
  quality: number = WEBP_QUALITY,
): Promise<OptimizeResult[]> {
  return Promise.all(files.map((f) => optimizeImage(f, quality)));
}

// ─── Utilidades de formato ────────────────────────────────────────────────────

/**
 * Formatea bytes en una cadena legible.
 * @example formatBytes(153600) → "150.0 KB"
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k     = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i     = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
}

/**
 * Convierte un Blob a Base64.
 * Útil si el backend espera la imagen encodificada.
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader      = new FileReader();
    reader.onloadend  = () => resolve(reader.result as string);
    reader.onerror    = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Verifica si el navegador soporta exportación a WebP desde Canvas.
 * (Todos los navegadores modernos lo hacen; útil para pruebas / SSR).
 */
export function supportsWebP(): boolean {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width  = 1;
  canvas.height = 1;
  return canvas.toDataURL(OUTPUT_FORMAT).startsWith('data:image/webp');
}
