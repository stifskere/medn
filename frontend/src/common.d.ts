type State<T> = [T, (value: T | ((prev: T) => T)) => void];

interface ApiResponse<T> {
    is_error: boolean;
    reason: string | undefined;
    result: T | undefined
}

interface AppConfig {
    name: string;
}

type BaseProps<TChildren> = React.DetailedHTMLProps<React.HTMLAttributes<TChildren>, TChildren>;

interface Session {
    expires_in_seconds: number;
}

interface User {
    email: string;
    name: string;
    admin: boolean;
    max_storage: number;
    used_storage: number;
    ui_language: string;
    upload_path: string;
    session: Session;
}

interface RequiresUser {
    user: User
}
