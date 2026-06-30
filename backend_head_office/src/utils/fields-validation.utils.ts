const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isNullOrEmpty(value?: string | null | undefined): boolean {
    return !value || value.trim() === '';
}

export function isValidUuid(uuid: string): boolean {
    return !isNullOrEmpty(uuid) && UUID_V4.test(uuid);
}

export function isValidId(id: number | null | undefined): boolean {
    return typeof id === 'number' && !isNaN(id) && id > 0;
}

export function isValidEmail(email: string): boolean {
    return !isNullOrEmpty(email) && EMAIL.test(email);
}
