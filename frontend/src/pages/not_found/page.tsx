import {ReactElement} from "react";

import "./styles.css";

export default function NotFound(): ReactElement {
    return <>
        <img className="logo" src="/api/config/logo" alt="logo"/>
        <div className="not-found-main">
            <h1>404</h1>
            <p>The page you requested was not found.</p>
        </div>
    </>
}