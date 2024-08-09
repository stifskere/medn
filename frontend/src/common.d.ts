
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
