

export function formatBytes(bytes: number): string {
    // doubt google is using this any time.
    const units: string[] = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    let i: number = 0;

    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }

    return `${bytes.toFixed(2)}${units[i]}`;
}
