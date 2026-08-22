import AppError from './AppError.js';

export type CsvRow = Record<string, string>;

const escapeCsvValue = (value: unknown): string => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};

export const serializeCsv = (headers: string[], rows: Array<Record<string, unknown>>): string => [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(',')),
].join('\r\n') + '\r\n';

const normalizeHeader = (header: string): string =>
    header
        .replace(/^\uFEFF/, '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s-]+/g, '_');

const detectDelimiter = (line: string): ',' | ';' => {
    const commas = (line.match(/,/g) || []).length;
    const semicolons = (line.match(/;/g) || []).length;
    return semicolons > commas ? ';' : ',';
};

export const parseCsv = (buffer: Buffer): { headers: string[]; rows: CsvRow[] } => {
    if (!buffer?.length) throw new AppError('El archivo CSV está vacío', 400);

    const input = buffer.toString('utf8').replace(/^\uFEFF/, '');
    const delimiter = detectDelimiter(input.split(/\r?\n/, 1)[0] || '');
    const matrix: string[][] = [];
    let row: string[] = [];
    let field = '';
    let quoted = false;

    for (let index = 0; index < input.length; index += 1) {
        const character = input[index];
        const next = input[index + 1];

        if (character === '"') {
            if (quoted && next === '"') {
                field += '"';
                index += 1;
            } else {
                quoted = !quoted;
            }
            continue;
        }

        if (!quoted && character === delimiter) {
            row.push(field.trim());
            field = '';
            continue;
        }

        if (!quoted && (character === '\n' || character === '\r')) {
            if (character === '\r' && next === '\n') index += 1;
            row.push(field.trim());
            field = '';
            if (row.some((value) => value !== '')) matrix.push(row);
            row = [];
            continue;
        }

        field += character;
    }

    if (quoted) throw new AppError('El CSV contiene una comilla sin cerrar', 400);
    if (field || row.length) {
        row.push(field.trim());
        if (row.some((value) => value !== '')) matrix.push(row);
    }

    if (matrix.length < 2) throw new AppError('El CSV debe contener encabezados y al menos una fila', 400);

    const headers = matrix[0].map(normalizeHeader);
    if (headers.some((header) => !header)) throw new AppError('El CSV contiene encabezados vacíos', 400);
    if (new Set(headers).size !== headers.length) throw new AppError('El CSV contiene encabezados repetidos', 400);

    const rows = matrix.slice(1).map((values) =>
        headers.reduce<CsvRow>((record, header, index) => {
            record[header] = values[index] || '';
            return record;
        }, {})
    );

    return { headers, rows };
};
