import { ReactElement } from "react";

import "./styles.css";

interface ProgressBarProps extends BaseProps<HTMLDivElement> {
    max: number;
    current: number;
}

export default function ProgressBar({current, max, className, ...props}: ProgressBarProps): ReactElement {
    return <div className={`progress-bar ${className || ""}`} {...props}>
        <div style={{ width: `${((current / max) % 100)}%` }} />
    </div>;
}
