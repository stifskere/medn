import useFetch, {FetchResponse} from "@hooks/use_fetch";
import { AppServices, Services } from "../utils";

import { MutableRefObject, useContext, useEffect, useMemo, useRef } from "react";
import { LuUnplug } from "react-icons/lu";

export default function useUser(redirect: boolean): User | undefined | null {
    const { queueNotification }: Services = useContext(AppServices);
    const result: FetchResponse = useFetch("/api/session/profile");
    const movedMouse: MutableRefObject<boolean> = useRef<boolean>(true);
    const user = useMemo((): User | undefined =>
        !result.has_reply || result.code != 200
            ? undefined 
            : (JSON.parse(result.body!) as ApiResponse<User>).result!
    , [result]);

    useEffect((): (() => void) => {
        const unsetMoved: NodeJS.Timeout = setInterval((): void => {
            movedMouse.current = false;
        }, 200000);

        function setMoved(): void {
            movedMouse.current = true;
        }

        document.addEventListener("mousemove", setMoved);

        return (): void => {
            document.removeEventListener("mousemove", setMoved);
            clearInterval(unsetMoved);
        };
    }, []);

    useEffect((): (() => void) | void => {
        if (user === undefined)
            return;

        let timeout: NodeJS.Timeout = setTimeout(async (): Promise<void> => {
            if (movedMouse.current) {
                const timeRequest = await fetch("/api/session/request-time");

                if (timeRequest.ok) {
                    result.refresh();
                    return;
                }
            }

            queueNotification({
                time: 10000,
                title: "Session expiration",
                content: "You will be logged out in ~1 minute.",
                icon: <LuUnplug/>
            });

            setTimeout((): void => {
                location.href = "/login"
            }, 63000);
        }, (user.session.expires_in_seconds - 60) * 1000);

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
