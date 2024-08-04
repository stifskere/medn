import {ReactElement} from "react";

import "./styles.css";

interface InputProps {
    displayText: string;
    name?: string;
    type: "text" | "password" | "number" | "email";
    error?: string;
}

export default function Input({displayText, name, type = "text", error}: InputProps): ReactElement {
    return <div className="input-box">
        <label htmlFor={`${displayText}-input`}>{
            displayText[0].toUpperCase() + displayText.substring(1).toLowerCase()
        }</label>
        <input
            type={type}
            id={`${displayText.toLowerCase().replace(/ /g, "-")}-input`}
            name={name ?? displayText.toLowerCase()}
            className={"input" + (error != undefined ? " input-error" : "")}
            placeholder={displayText.toLowerCase()}
            autoComplete="off"
        />
        {error != undefined && <p className="error-text">{error}</p>}
    </div>
}