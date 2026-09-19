import bcrypt from 'bcryptjs';
export async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}
export async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}
