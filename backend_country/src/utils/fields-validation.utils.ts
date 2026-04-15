const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i; // Validate UUID v4 format

export function isNullOrEmpty(value?: string | null | undefined): boolean {
    return !value || value.trim() === '';
}

export function isValidNumber(value: number | null | undefined): boolean {
    return typeof value === 'number' && !isNaN(value);
}

export function validateUuid(uuid: string): boolean {
    return !isNullOrEmpty(uuid) && UUID_V4.test(uuid);
}