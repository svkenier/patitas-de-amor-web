import {
  getFile,
  putFile,
  extractPathFromCdnUrl,
  createBlob,
  commitGitTree,
  type TreeItem,
} from './github.js';
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
        await putFile('README.md', { type: 'text', content: '# Storage Bank\n\nDatabase initialized.' }, 'Initialize repository', env);
      }
    } catch (e) {
      console.warn('Failed to check/create README.md', e);
    }
  }

  // 1. Subir blobs de imágenes nuevas concurrentemente (Git Blobs API - no crea commits en la rama)
  const imageEntries: TreeItem[] = await Promise.all(
    newImages.map(async (img) => {
      const cleanBase64 = img.base64.replace(/^data:[^;]+;base64,/, '').trim();
      const blobSha = await createBlob(cleanBase64, 'base64', env);
      return {
        path: img.path,
        mode: '100644',
        type: 'blob',
        sha: blobSha,
      };
    })
  );

  // 2. Entradas de eliminación para imágenes marcadas (sha: null las borra del árbol)
  const deleteEntries: TreeItem[] = [];
  for (const url of imagesToDelete) {
    const p = extractPathFromCdnUrl(url, env);
    if (p) {
      deleteEntries.push({
        path: p,
        mode: '100644',
        type: 'blob',
        sha: null,
      });
    }
  }

  // 3. Ficha individual JSON
  const indJsonEntry: TreeItem = {
    path: individualJsonPath,
    mode: '100644',
    type: 'blob',
    content: JSON.stringify(document, null, 2),
  };

  // 4. Actualizar array maestro
  const index = array.findIndex(item => item.id === id);
  if (index >= 0) {
    array[index] = document;
  } else {
    array.unshift(document);
  }

  // 5. Commit atómico en Git con reintento ante concurrencia (422)
  const MAX_RETRIES = 3;
  let currentArray = array;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const refreshedMaster = await getFile(masterJsonPath, env);
        let refreshedArray: T[] = [];
        if (refreshedMaster) {
          try {
            const parsed = JSON.parse(Buffer.from(refreshedMaster.content, 'base64').toString('utf-8'));
            refreshedArray = Array.isArray(parsed) ? parsed : (Object.values(parsed).find(Array.isArray) as T[]) || [];
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

      const masterJsonEntry: TreeItem = {
        path: masterJsonPath,
        mode: '100644',
        type: 'blob',
        content: JSON.stringify(currentArray, null, 2),
      };

      const documentName = (document as any).nombre || (document as any).title || id;
      await commitGitTree(
        {
          message: `${isUpdate ? 'Update' : 'Add'} document ${id}: ${documentName}`,
          entries: [...imageEntries, indJsonEntry, masterJsonEntry, ...deleteEntries],
        },
        env
      );
      break;
    } catch (err: any) {
      const isConflict = err?.status === 422 || /422|conflict|fast-forward/i.test(err?.message ?? '');
      if (isConflict && attempt < MAX_RETRIES - 1) {
        const baseMs = 300 * Math.pow(2, attempt);
        const jitter = Math.floor(Math.random() * 150);
        console.warn(`[Git Tree Conflict]: Reintento ${attempt + 1}/${MAX_RETRIES} para ${masterJsonPath} tras ${baseMs + jitter}ms...`);
        await delay(baseMs + jitter);
        continue;
      }
      throw err;
    }
  }

  return document;
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

  const masterEntry: TreeItem = {
    path: masterJsonPath,
    mode: '100644',
    type: 'blob',
    content: JSON.stringify(array, null, 2),
  };

  const indJsonEntry: TreeItem = {
    path: individualJsonPath,
    mode: '100644',
    type: 'blob',
    sha: null,
  };

  const imageEntries: TreeItem[] = [];
  for (const url of imagesToDelete) {
    const p = extractPathFromCdnUrl(url, env);
    if (p) {
      imageEntries.push({
        path: p,
        mode: '100644',
        type: 'blob',
        sha: null,
      });
    }
  }

  await commitGitTree(
    {
      message: `Delete document ${id}: ${documentName}`,
      entries: [masterEntry, indJsonEntry, ...imageEntries],
    },
    env
  );
}
