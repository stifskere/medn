import useFetch, {FetchResponse} from "@hooks/use_fetch";

export interface User {
    email: string;
    name: string;
    admin: boolean;
    max_storage: number;
    used_storage: number;
}

export default function useUser(redirect: boolean): User | undefined | null {
    const result: FetchResponse = useFetch("/api/auth/profile");

    if (!result.has_reply)
        return undefined;

    if (result.code != 200) {
        const parsedBody: ApiResponse<never> 
            = <ApiResponse<never>>JSON.parse(result.body!);

        console.log(parsedBody.reason);

        if (redirect)
            location.assign(`/login?error=${encodeURIComponent(parsedBody.reason!)}`);
        return null;
    }

    return (<ApiResponse<User>>JSON.parse(result.body!))
        .result!;
}
