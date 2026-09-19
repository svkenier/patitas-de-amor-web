import { getAuthPayload } from '../../../src/core/auth/auth.js';
import { getCollection, upsertDocument, deleteDocument, type ImageUploadInfo } from '../../../src/core/github/collectionService.js';
import { ROLE_LEVEL, type UserRole } from '../../../src/core/types/user.js';
import type { BaseRecord, RecordUpsertBody, RecordDeleteBody } from '../../../src/core/types/record.js';
import { cdnImageUrl, generateItemId } from '../../../src/core/github/github.js';
import type { Env } from '../../../src/core/auth/auth.js';
import { RecordUpsertSchema } from '../../../src/core/schema/collections.js';

const getCollectionPaths = (collection: string) => ({
  master: `data/${collection}.json`,
  ind: (id: string) => `data/${collection}/${id}.json`,
  imgPath: (id: string, suffix: string) => `images/${collection}/${id}${suffix}.webp`
});

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const collectionName = params.collection as string;

  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });

  const paths = getCollectionPaths(collectionName);

  const payload = await getAuthPayload(request, env);
  if (!payload) return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  if (ROLE_LEVEL[payload.role as UserRole] < ROLE_LEVEL['voluntario']) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  if (request.method === 'POST' || request.method === 'PUT') return handleUpsert(request, env, paths, request.method === 'PUT');
  if (request.method === 'DELETE') return handleDelete(request, env, paths);

  return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
};

async function handleUpsert(request: Request, env: Env, paths: any, isUpdate: boolean) {
  try {
    const rawBody = await request.json();
    const validationResult = RecordUpsertSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        success: false, 
        errors: validationResult.error.format() 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const body = validationResult.data as RecordUpsertBody;

    const itemId = body.id ?? generateItemId();
    const collection = await getCollection<BaseRecord>(paths.master, env);
    const existingRecord = collection.find(p => p.id === itemId) || null;

    const newImages: ImageUploadInfo[] = [];
    const imagesToDelete: string[] = [];

    let mainImageUrl = existingRecord?.main_image ?? '';
    const ts = Date.now();

    if (body.main_image_base64) {
      if (existingRecord?.main_image) imagesToDelete.push(existingRecord.main_image);
      const newImgPath = paths.imgPath(itemId, `-${ts}`);
      newImages.push({ path: newImgPath, base64: body.main_image_base64 });
      mainImageUrl = cdnImageUrl(newImgPath, env);
    }

    const existingGallery = body.gallery_existing ?? existingRecord?.gallery ?? [];
    const newGalleryUrls: string[] = [];

    if (body.gallery_base64?.length) {
      for (let i = 0; i < body.gallery_base64.length; i++) {
        const newImgPath = paths.imgPath(itemId, `-gallery-${ts}-${i}`);
        newImages.push({ path: newImgPath, base64: body.gallery_base64[i] });
        newGalleryUrls.push(cdnImageUrl(newImgPath, env));
      }
    }

    if (isUpdate && existingRecord) {
      const keptUrls = new Set(existingGallery);
      for (const oldUrl of (existingRecord.gallery || [])) {
        if (!keptUrls.has(oldUrl)) imagesToDelete.push(oldUrl);
      }
    }

    const now = new Date().toISOString();
    const record: BaseRecord = {
      id: itemId,
      title: body.title.trim(),
      description: body.description ?? existingRecord?.description ?? '',
      type: body.type ?? existingRecord?.type ?? 'general',
      status: body.status ?? existingRecord?.status ?? 'active',
      attributes: body.attributes ?? existingRecord?.attributes ?? {},
      main_image: mainImageUrl,
      gallery: [...existingGallery, ...newGalleryUrls],
      created_at: existingRecord?.created_at ?? now,
      updated_at: now,
    };

    const result = await upsertDocument<BaseRecord>(
      paths.master,
      paths.ind(itemId),
      itemId,
      record,
      env,
      newImages,
      imagesToDelete
    );

    return new Response(JSON.stringify({ ok: true, record: result }), { status: isUpdate ? 200 : 201, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Error in handleUpsert:', err);
    return new Response(JSON.stringify({ error: 'Error interno guardando registro' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleDelete(request: Request, env: Env, paths: any) {
  try {
    const { id } = await request.json() as RecordDeleteBody;
    if (!id) return new Response(JSON.stringify({ error: 'El campo id es requerido' }), { status: 400 });

    const collection = await getCollection<BaseRecord>(paths.master, env);
    const record = collection.find(p => p.id === id);
    if (!record) return new Response(JSON.stringify({ error: 'Registro no encontrado' }), { status: 404 });

    const imagesToDelete: string[] = [];
    if (record.main_image) imagesToDelete.push(record.main_image);
    if (record.gallery) imagesToDelete.push(...record.gallery);

    await deleteDocument<BaseRecord>(paths.master, paths.ind(id), id, env, imagesToDelete);

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Error in handleDelete:', err);
    return new Response(JSON.stringify({ error: 'Error interno eliminando registro' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
