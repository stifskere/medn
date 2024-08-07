import { ReactElement, SyntheticEvent, useEffect, useState } from "react";

import useUser, { User } from "@hooks/use_user";

import SideBar from "@components/sidebar/component";

import "./styles.css";
import { updateStateOnInput } from "../../utils";

interface ApiRouteError {
    content: string;
    type: "error" | "warning";
}

interface PasswordError {
    password?: string;
    repeat?: string;
}

export default function Settings(): ReactElement {
    const user: null | undefined | User = useUser(true);

    const [apiKeyWarning, setApiKeyWarning]: State<boolean> = useState<boolean>(false);
    const [apiKey, setApiKey]: State<string | undefined | null>
        = useState<string | undefined | null>();

    const [apiRoute, setApiRoute]: State<string> = useState<string>("");
    const [apiRouteError, setApiRouteError]: State<ApiRouteError | undefined> 
        = useState<ApiRouteError | undefined>();

    const [password, setPassword]: State<string> = useState<string>("");
    const [repeatPassword, setRepeatPassword]: State<string> = useState<string>("");
    const [passwordError, setPasswordError]: State<PasswordError> = useState<PasswordError>({});

    async function resetApiKey(): Promise<void> {
        const result = await fetch("/api/auth/api-key");

        if (!result.ok) {
            setApiKey(null);
            return;
        }

        setApiKey((await result.json() as ApiResponse<string>).result);
        setApiKeyWarning(false);
    }

    useEffect((): void => {
        if (user)
            setApiRoute(user.upload_path);
    }, [user]);

    useEffect((): void => {
        function checkBraceMatching(route: string): boolean {
            const stack: string[] = [];

            for (const char of route) {
                if (char == "{")
                  stack.push(char);
                else if (char == "}") {
                    if (stack.length == 0)
                        return false;
                    stack.pop();
                }
            }

            return stack.length == 0;
        }

        let validVariables: string[] = ["unix_s", "unix_ms", "format"];

        setApiRouteError(undefined);

        if (!apiRoute.includes("{"))
            setApiRouteError({
                content: "The route doesn't ever differ, the file will be overwitten on every upload. Try adding some template {}.",
                type: "warning"
            });

        for (const match of apiRoute.matchAll(/\{([^\{\}]*)}/g)) {
            if (!validVariables.includes(match[1]))
                setApiRouteError({
                    content: `{${match[1]}} is not a valid identifier.`,
                    type: "error"
                });
        }

        if (!checkBraceMatching(apiRoute))
            setApiRouteError({
                content: "Unclosed templates found, the { do not match the }",
                type: "error"
            });

        if (!apiRoute.startsWith("/"))
            setApiRouteError({
                content: "The path must start with /, so from the root storage directory.",
                type: "error"
            });

        if (apiRoute.endsWith("/"))
            setApiRouteError({
                content: "The path cannot be a directory, so it cannot end with /.",
                type: "error"
            });

        if (apiRoute.length == 0)
            setApiRouteError({
                content: "By default the upload route is /{unix_s}.{format}, check out the documentation for more information.",
                type: "warning"
            });


    }, [apiRoute]);

    useEffect((): void => {
        let passError: string | undefined = undefined; 
        let repeatError: string | undefined = undefined;

        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/.test(password) && password.length !== 0)
            passError = "The password doesn't match the rules.";

        if (password !== repeatPassword && password.length !== 0)
            repeatError = "Passwords do not match.";

        setPasswordError({
            password: passError,
            repeat: repeatError
        });
    }, [password, repeatPassword]);

    async function updateApiPath(): Promise<void> {
        await fetch("/api/config/user/upload_path", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `upload_path=${encodeURIComponent(apiRoute)}`,
            credentials: "same-origin"
        });
    }

    if (user === null || user === undefined)
        return <></>;

    return <>
        <SideBar user={user} />
        <div className="settings-wrapper">
            <div>
                <h1>API Settings</h1>
                <div className="api-key-container">
                    <p className="setting-title">API KEY <span>| To see your API key you must reset it.</span></p>
                    <input className="input" value={apiKey || "********************************"} readOnly/>
                    {
                        apiKeyWarning
                        ? <div>
                            <p className="warning-text">
                                This is a potentially destructive action,
                                if you reset your API key, any workflow attached
                                to it might stop working, are you sure you want to
                                continue?
                            </p>
                            <div>
                                <button className="button warning-button" onClick={resetApiKey}>Yes</button>
                                <button className="button" onClick={(): void => setApiKeyWarning(false)}>No</button>
                            </div>
                        </div>
                        : <div>
                            <p className={apiKey ? "warning-text" : "error-text"}>
                              {
                                  apiKey === null
                                      ? "There was an error while resetting the API key."
                                      : apiKey && "Make sure to copy your API key, as you will only be able to see it once."
                              }
                            </p>
                            <div>
                                <button className="button" onClick={(): void => setApiKeyWarning(true)}>Reset key</button>
                            </div>
                        </div>
                    }
                </div>
                <div className="api-route-container">
                    <p className="setting-title">UPLOAD PATH <span>
                        | Configure the path for your API uploads.</span>
                    </p>
                    <input 
                        className={`input ${apiRouteError?.type === "error" ? "input-error" : ""}`} 
                        placeholder="API uploads route" 
                        onInput={updateStateOnInput(setApiRoute)} value={apiRoute}
                    />
                    <div>
                        <p className={`${apiRouteError?.type || "error"}-text`}>{apiRouteError?.content || ""}</p>
                        <button
                            className="button" 
                            disabled={(apiRouteError?.content.length ?? 0) !== 0 && apiRouteError?.type === "error"}
                            onClick={updateApiPath}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
            <div>
                <h1>User Settings</h1>
                <div className="password-container">
                    <p className="setting-title">
                        PASSWORD <span>| If you reset your password you will have to login again.</span>
                    </p>
                    <div>
                        <div>
                            <label htmlFor="password-input">New Password</label>
                            <input
                                className={`input ${passwordError.password ? "input-error" : ""}`} 
                                id="password-input" autoComplete="off"
                                type="password" placeholder="**********"
                                onInput={updateStateOnInput(setPassword)}
                            />
                            <p className="error-text">{passwordError.password || " "}</p>
                        </div>
                        <div>
                            <label htmlFor="repeat-password-input">Repeat Password</label>
                            <input
                                className={`input ${passwordError.repeat ? "input-error" : ""}`} 
                                id="repeat-password-input" autoComplete="off"
                                type="password" placeholder="**********"
                                onInput={updateStateOnInput(setRepeatPassword)}
                            />
                            <p className="error-text">{passwordError.repeat || " "}</p>
                        </div>
                    </div>
                    {passwordError.password && <p className="warning-text">
                            The password should contain at least 1 Uppercase; 1 Lowercase; 1 Number and 1 Symbol.
                    </p>}
                </div>
            </div>
        </div>
    </>;
}

