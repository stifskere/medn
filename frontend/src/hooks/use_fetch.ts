import {MutableRefObject, useEffect, useRef, useState} from "react";

export interface FetchResponse {
    has_reply: boolean;
    body: string | undefined;
    code: number | undefined;
    refresh(): void;
}

interface FetchHookInit extends RequestInit {
    defer?: boolean
}

export default function useFetch(
  location: string,
  init?: FetchHookInit
): FetchResponse {
    const [result, setResult] = useState<Response | undefined>();
    const textBody: MutableRefObject<string | undefined> = useRef<string | undefined>();

    async function refresh() {
        const res = await fetch(location, init);
        const body = await res.text();
        textBody.current = body;
        setResult(res);
    }

    useEffect(() => {
        if (init?.defer)
            return;

        refresh();
    }, [location, init]);

    return result === undefined
        ? {
            has_reply: false,
            code: undefined,
            body: undefined,
            refresh,
        }
        : {
            has_reply: true,
            code: result.status,
            body: textBody.current,
            refresh,
        };
}
