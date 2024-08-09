import { createContext, SyntheticEvent } from "react";
import { Notification } from "@hooks/use_notifications";

export function formatBytes(bytes: number): string {
    const units: string[] = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    let i: number = 0;

    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }

    return `${Number.isInteger(bytes) ? bytes : bytes.toFixed(2)}${units[i]}`;
}

export function updateStateOnInput<T extends string>(setter: ((_: T) => void)): 
((_: SyntheticEvent<HTMLInputElement>) => void) {
    return (event: SyntheticEvent<HTMLInputElement>): void => {
        setter(<T>(event.target as HTMLInputElement).value);
    };
}

export interface Services {
    queueNotification(_: Notification): void;
}

export const AppServices = createContext<Services>({
    queueNotification(_: Notification): void {}
});
