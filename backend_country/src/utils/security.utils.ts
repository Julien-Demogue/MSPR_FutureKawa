import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export async function hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;

    return `${salt}:${derivedKey.toString('hex')}`;
}

export async function compareHash(password: string, hashedPassword: string): Promise<boolean> {
    const [salt, key] = hashedPassword.split(':');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    const keyBuffer = Buffer.from(key, 'hex');

    return timingSafeEqual(derivedKey, keyBuffer);
}