export const getQueryString = (value: unknown): string | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }

    if (typeof value === 'string' && value.trim()) {
        return value;
    }

    if (Array.isArray(value)) {
        const first = value.find((item) => typeof item === 'string' && item.trim());
        return typeof first === 'string' ? first : null;
    }

    return null;
};
