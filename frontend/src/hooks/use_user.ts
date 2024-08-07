import useFetch, {FetchResponse} from "@hooks/use_fetch";

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
    const result: FetchResponse = useFetch("/api/auth/profile");

    if (!result.has_reply)
        return undefined;

    if (result.code != 200) {
        const parsedBody: ApiResponse<never> 
            = <ApiResponse<never>>JSON.parse(result.body!);

        if (redirect)
            location.href = `/login?error=${encodeURIComponent(parsedBody.reason!)}`;

        return null;
    }

    const user: User = (<ApiResponse<User>>JSON.parse(result.body!))
        .result!;

    setTimeout((): void => {
        location.href = "/login";
    }, (user.expires_in + 3) * 1000);

    return user;
}
