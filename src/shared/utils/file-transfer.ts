/**
 * Общие утилиты файлового transfer (round-trip import/export).
 *
 * Раньше каждый экспорт (Memory/Logs/ProviderManager/...) дублировал паттерн
 * Blob-даунлоада, а импорт отсутствовал в ~9 панелях. Эти функции
 * унифицируют download и readFileAsText для переиспользования.
 */

export function downloadText(filename: string, text: string, mime = 'application/json'): void {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Читает JSON-файл и парсит его. Бросает Error при пустом/невалидном JSON.
 */
export async function importJsonFromFile(file: File): Promise<unknown> {
    const raw = await readFileAsText(file);
    if (!raw?.trim()) throw new Error('File is empty');
    try {
        return JSON.parse(raw);
    } catch {
        throw new Error('Invalid JSON format');
    }
}
