import { ReactElement, useEffect, useState } from "react";

import ProgressBar from "@components/progress/component";

export interface Notification {
    icon?: ReactElement;
    title?: string;
    content: string;
    time?: number;
}

export type NotifInterface = [ReactElement, (_: Notification) => void];

const DEFAULT_NOTIF_TIME: number = 5000;

export default function useNotifications(): [ReactElement, (_: Notification) => void] {
    const [queue, setQueue]: State<Notification[]> = useState<Notification[]>([]); 
    const [elapsed, setElapsed]: State<number> = useState<number>(0);

    const current: Notification | undefined = queue[0];

    function addNotification(notification: Notification): void {
        notification.time = (notification.time || DEFAULT_NOTIF_TIME) + 200;
        setQueue((prev: Notification[]): Notification[] => [...prev, notification]);
    }

    useEffect((): (() => void) | void => {
        if (queue.length <= 0)
            return;

        if (elapsed == -1) {
            setTimeout((): void => {
                setElapsed(0);
                setQueue((prev: Notification[]): Notification[] => prev.slice(1));
            }, 1000);
        }

        const interval: NodeJS.Timeout = setInterval((): void => {
            if (elapsed == -1)
                return;

            setElapsed((prev: number): number =>
                prev + 100 >= current.time! ? -1 : prev + 100
            );
        }, 100);

        return (): void => { clearInterval(interval); };
    }, [queue, elapsed]);

    return [
        current !== undefined
        ? (<div
            className={
                `notification ${
                    elapsed > 100 && elapsed < current.time! - 100
                        ? "shown-notification"
                        : ""
                }`
            }
        >
            {current.icon}
            <div className="notification-content">
                {current.title && <b>{current.title}</b>}
                <p>{current.content}</p>
            </div>
            <ProgressBar 
                className="notification-remaining"
                max={current.time! - 200}
                current={elapsed}
            />
        </div>)
        : (<></>),
        addNotification
    ];
}
