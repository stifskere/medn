import useFetch, {FetchResponse} from "@hooks/use_fetch";
import { AppServices, Services } from "../utils";

import { useContext, useEffect, useMemo } from "react";
import { LuUnplug } from "react-icons/lu";

export interface User {
    email: string;
    name: string;
    admin: boolean;
    max_storage: number;
    used_storage: number;
    ui_language: string;
    upload_path: string;
    expires_in: number;
}

export default function useUser(redirect: boolean): User | undefined | null {
    const { queueNotification }: Services = useContext(AppServices);
    const result: FetchResponse = useFetch("/api/auth/profile");

    const user = useMemo((): User | undefined =>
        !result.has_reply || result.code != 200 
            ? undefined 
            : (JSON.parse(result.body!) as ApiResponse<User>).result!
    , [result]);

    useEffect((): (() => void) | void => {
        if (user === undefined)
            return;

        let timeout: NodeJS.Timeout = setTimeout((): void => {
            queueNotification({
                time: 10000,
                title: "Session expiration",
                content: "You will be logged out in ~1 minute.",
                icon: <LuUnplug/>
            });

            setTimeout((): void => {
                location.href = "/login"
            }, 63000);
        }, (user.expires_in - 60) * 1000);

        return (): void => { clearTimeout(timeout); };
    }, [result]);

    if (!result.has_reply)
        return undefined;

    if (result.code != 200) {
        const parsedBody: ApiResponse<never>
            = JSON.parse(result.body!) as ApiResponse<never>;

        if (redirect)
            location.href = `/login?error=${encodeURIComponent(parsedBody.reason!)}`;

        return null;
    }

    return user;
}
