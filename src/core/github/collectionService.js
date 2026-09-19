import { getFile, putFile, deleteFile, extractPathFromCdnUrl } from './github.js';
export async function getCollection(masterJsonPath, env) {
    const masterFile = await getFile(masterJsonPath, env);
    if (!masterFile)
        return [];
    try {
        const parsed = JSON.parse(Buffer.from(masterFile.content, 'base64').toString('utf-8'));
        if (Array.isArray(parsed))
            return parsed;
        const firstArray = Object.values(parsed).find(Array.isArray);
        return firstArray || [];
    }
    catch {
        return [];
    }
}
export async function upsertDocument(masterJsonPath, individualJsonPath, id, document, env, newImages = [], imagesToDelete = []) {
    const masterFile = await getFile(masterJsonPath, env);
    let array = [];
    if (masterFile) {
        try {
            const parsed = JSON.parse(Buffer.from(masterFile.content, 'base64').toString('utf-8'));
            if (Array.isArray(parsed))
                array = parsed;
            else {
                const firstArray = Object.values(parsed).find(Array.isArray);
                array = firstArray || [];
            }
        }
        catch {
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
        }
        catch (e) {
            console.warn('Failed to check/create README.md', e);
        }
    }
    for (const img of newImages) {
        await putFile(img.path, img.base64, `${isUpdate ? 'Update' : 'Add'} image for ${id}`, env);
    }
    for (const url of imagesToDelete) {
        const oldPath = extractPathFromCdnUrl(url, env);
        if (oldPath) {
            try {
                const oldFile = await getFile(oldPath, env);
                if (oldFile)
                    await deleteFile(oldPath, oldFile.sha, `Remove old image for ${id}`, env);
            }
            catch (e) {
                console.warn('Failed to delete old image', oldPath, e);
            }
        }
    }
    const index = array.findIndex(item => item.id === id);
    if (index >= 0) {
        array[index] = document;
    }
    else {
        array.unshift(document);
    }
    const indFile = await getFile(individualJsonPath, env);
    await putFile(individualJsonPath, JSON.stringify(document, null, 2), `${isUpdate ? 'Update' : 'Add'} individual JSON for ${id}`, env, indFile?.sha);
    const masterJsonStr = JSON.stringify(array, null, 2);
    await putFile(masterJsonPath, masterJsonStr, `${isUpdate ? 'Update' : 'Add'} document ${id} in master JSON`, env, masterFile?.sha);
    return document;
}
export async function deleteDocument(masterJsonPath, individualJsonPath, id, env, imagesToDelete = []) {
    const masterFile = await getFile(masterJsonPath, env);
    if (!masterFile)
        throw new Error('Master JSON not found');
    let array = [];
    try {
        const parsed = JSON.parse(Buffer.from(masterFile.content, 'base64').toString('utf-8'));
        if (Array.isArray(parsed))
            array = parsed;
        else {
            const firstArray = Object.values(parsed).find(Array.isArray);
            array = firstArray || [];
        }
    }
    catch {
        throw new Error('Master JSON is invalid');
    }
    const index = array.findIndex(item => item.id === id);
    if (index < 0)
        throw new Error('Document not found in master JSON');
    const documentName = array[index].nombre || array[index].title || id;
    array.splice(index, 1);
    const masterJsonStr = JSON.stringify(array, null, 2);
    await putFile(masterJsonPath, masterJsonStr, `Delete document ${id}: ${documentName}`, env, masterFile.sha);
    try {
        const indFile = await getFile(individualJsonPath, env);
        if (indFile) {
            await deleteFile(individualJsonPath, indFile.sha, `Delete individual JSON for ${id}`, env);
        }
    }
    catch (err) {
        console.warn(`Could not delete individual JSON for ${id}`, err);
    }
    for (const url of imagesToDelete) {
        const imgPath = extractPathFromCdnUrl(url, env);
        if (imgPath) {
            try {
                const file = await getFile(imgPath, env);
                if (file)
                    await deleteFile(imgPath, file.sha, `Delete image for ${id}`, env);
            }
            catch (err) {
                console.warn(`Could not delete image ${imgPath}`, err);
            }
        }
    }
}
