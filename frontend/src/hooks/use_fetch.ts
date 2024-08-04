import {useEffect, useState} from "react";

export interface FetchResponse {
    has_reply: boolean;
    body: string | undefined;
    code: number | undefined;
}

export default function useFetch
    (location: string, init?: RequestInit): FetchResponse {
    const [result, setResult]: State<FetchResponse | undefined> = useState();

    useEffect((): void => {
         fetch(location, init)
             .then((result: Response) =>
                 result.text().then((body: string): void => setResult(
                     {
                         body,
                         code: result.status,
                         has_reply: true
                     }
                 ))
             )
    }, []);

    return result === undefined
        ? { has_reply: false, code: undefined, body: undefined }
        : result;
}
