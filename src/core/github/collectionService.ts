import { getFile, putFile, deleteFile, extractPathFromCdnUrl } from './github.js';
import type { Env } from '../auth/auth.js';

export interface ImageUploadInfo {
  base64: string;
  path: string;
}

export async function getCollection<T extends { id: string }>(masterJsonPath: string, env: Env): Promise<T[]> {
  const masterFile = await getFile(masterJsonPath, env);
  if (!masterFile) return [];
  try {
    const parsed = JSON.parse(Buffer.from(masterFile.content, 'base64').toString('utf-8'));
    if (Array.isArray(parsed)) return parsed;
    const firstArray = Object.values(parsed).find(Array.isArray);
    return (firstArray as T[]) || [];
  } catch {
    return [];
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function upsertDocument<T extends { id: string }>(
  masterJsonPath: string,
  individualJsonPath: string,
  id: string,
  document: T,
  env: Env,
  newImages: ImageUploadInfo[] = [],
  imagesToDelete: string[] = []
): Promise<T> {
  const masterFile = await getFile(masterJsonPath, env);
  let array: T[] = [];
  if (masterFile) {
    try {
      const parsed = JSON.parse(Buffer.from(masterFile.content, 'base64').toString('utf-8'));
      if (Array.isArray(parsed)) array = parsed;
      else {
        const firstArray = Object.values(parsed).find(Array.isArray);
        array = (firstArray as T[]) || [];
      }
    } catch {
      array = [];
    }
  }

  const isUpdate = array.some(item => item.id === id);

  if (!masterFile && !isUpdate) {
    // If master JSON does not exist, the repository might be completely empty.
    // Ensure README.md exists to initialize the branch.
    try {
      const readme = await getFile('README.md', env);
      if (!readme) {
        await putFile('README.md', '# Storage Bank\n\nDatabase initialized.', 'Initialize repository', env);
      }
    } catch (e) {
      console.warn('Failed to check/create README.md', e);
    }
  }

  // Registro de imágenes subidas en esta operación para permitir rollback ante fallos
  const uploadedImagePaths: string[] = [];

  try {
    for (const img of newImages) {
      await putFile(img.path, img.base64, `${isUpdate ? 'Update' : 'Add'} image for ${id}`, env);
      uploadedImagePaths.push(img.path);
    }

    const index = array.findIndex(item => item.id === id);
    if (index >= 0) {
      array[index] = document;
    } else {
      array.unshift(document);
    }

    const indFile = await getFile(individualJsonPath, env);
    await putFile(
      individualJsonPath,
      JSON.stringify(document, null, 2),
      `${isUpdate ? 'Update' : 'Add'} individual JSON for ${id}`,
      env,
      indFile?.sha
    );

    // Bucle de reintento con backoff exponencial para actualización del índice maestro (HTTP 409 Conflict)
    const MAX_RETRIES = 3;
    let masterSha = masterFile?.sha;
    let currentArray = array;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          // Re-obtener la versión más reciente del archivo maestro en GitHub
          const refreshedMaster = await getFile(masterJsonPath, env);
          masterSha = refreshedMaster?.sha;
          let refreshedArray: T[] = [];
          if (refreshedMaster) {
            try {
              const parsed = JSON.parse(Buffer.from(refreshedMaster.content, 'base64').toString('utf-8'));
              if (Array.isArray(parsed)) refreshedArray = parsed;
              else {
                const firstArray = Object.values(parsed).find(Array.isArray);
                refreshedArray = (firstArray as T[]) || [];
              }
            } catch {
              refreshedArray = [];
            }
          }
          const itemIdx = refreshedArray.findIndex(item => item.id === id);
          if (itemIdx >= 0) {
            refreshedArray[itemIdx] = document;
          } else {
            refreshedArray.unshift(document);
          }
          currentArray = refreshedArray;
        }

        const masterJsonStr = JSON.stringify(currentArray, null, 2);
        await putFile(
          masterJsonPath,
          masterJsonStr,
          `${isUpdate ? 'Update' : 'Add'} document ${id} in master JSON`,
          env,
          masterSha
        );
        break; // Éxito
      } catch (err: any) {
        const isConflict = /does not match|conflict|409/i.test(err?.message ?? '');
        if (isConflict && attempt < MAX_RETRIES - 1) {
          const baseMs = 300 * Math.pow(2, attempt); // 300ms, 600ms, 1200ms
          const jitter = Math.floor(Math.random() * 150);
          console.warn(`[GitHub 409 Conflict]: Reintento ${attempt + 1}/${MAX_RETRIES} para ${masterJsonPath} tras ${baseMs + jitter}ms...`);
          await delay(baseMs + jitter);
          continue;
        }
        throw err;
      }
    }

    // Una vez asegurado el commit del master JSON, se eliminan las imágenes antiguas marcadas
    for (const url of imagesToDelete) {
      const oldPath = extractPathFromCdnUrl(url, env);
      if (oldPath) {
        try {
          const oldFile = await getFile(oldPath, env);
          if (oldFile) await deleteFile(oldPath, oldFile.sha, `Remove old image for ${id}`, env);
        } catch (e) {
          console.warn('Failed to delete old image', oldPath, e);
        }
      }
    }

    return document;
  } catch (error) {
    // Compensación / Rollback de imágenes recién subidas si la transacción falló
    if (uploadedImagePaths.length > 0) {
      console.warn(`[Transaction Rollback]: Limpiando ${uploadedImagePaths.length} imágenes huérfanas tras fallo de guardado...`);
      for (const imgPath of uploadedImagePaths) {
        try {
          const fileToCleanup = await getFile(imgPath, env);
          if (fileToCleanup) {
            await deleteFile(fileToCleanup.path, fileToCleanup.sha, `Rollback orphaned image: ${imgPath}`, env);
          }
        } catch (cleanupErr) {
          console.warn(`[Rollback Warning]: No se pudo eliminar imagen huérfana ${imgPath}`, cleanupErr);
        }
      }
    }
    throw error;
  }
}

export async function deleteDocument<T extends { id: string }>(
  masterJsonPath: string,
  individualJsonPath: string,
  id: string,
  env: Env,
  imagesToDelete: string[] = []
): Promise<void> {
  const masterFile = await getFile(masterJsonPath, env);
  if (!masterFile) throw new Error('Master JSON not found');

  let array: T[] = [];
  try {
    const parsed = JSON.parse(Buffer.from(masterFile.content, 'base64').toString('utf-8'));
    if (Array.isArray(parsed)) array = parsed;
    else {
      const firstArray = Object.values(parsed).find(Array.isArray);
      array = (firstArray as T[]) || [];
    }
  } catch {
    throw new Error('Master JSON is invalid');
  }

  const index = array.findIndex(item => item.id === id);
  if (index < 0) throw new Error('Document not found in master JSON');

  const documentName = (array[index] as any).nombre || (array[index] as any).title || id;
  array.splice(index, 1);

  const masterJsonStr = JSON.stringify(array, null, 2);
  await putFile(
    masterJsonPath,
    masterJsonStr,
    `Delete document ${id}: ${documentName}`,
    env,
    masterFile.sha
  );

  try {
    const indFile = await getFile(individualJsonPath, env);
    if (indFile) {
      await deleteFile(individualJsonPath, indFile.sha, `Delete individual JSON for ${id}`, env);
    }
  } catch (err) {
    console.warn(`Could not delete individual JSON for ${id}`, err);
  }

  for (const url of imagesToDelete) {
    const imgPath = extractPathFromCdnUrl(url, env);
    if (imgPath) {
      try {
        const file = await getFile(imgPath, env);
        if (file) await deleteFile(imgPath, file.sha, `Delete image for ${id}`, env);
      } catch (err) {
        console.warn(`Could not delete image ${imgPath}`, err);
      }
    }
  }
}
