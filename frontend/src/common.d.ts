
type State<T> = [T, (value: T) => void];

interface ApiResponse<T> {
    is_error: boolean;
    reason: string | undefined;
    result: T | undefined
}

type BaseProps<TChildren> = React.DetailedHTMLProps<React.HTMLAttributes<TChildren>, TChildren>;
