import {ReactElement, useEffect, useState} from "react";

import useUser from "@hooks/use_user";

import Input from "@components/input/component";

import "./styles.css";

export default function Login(): ReactElement {
    let possibleUser: User | undefined | null = useUser(false);
    const [loginStatus, setLoginStatus]: State<string | undefined>
        = useState<string | undefined>();
    const [emptyInputs, setEmptyInputs]: State<string[]>
        = useState<string[]>([]);

    useEffect((): (() => void) => {
        const form: HTMLFormElement
            = document.getElementById("login-form") as HTMLFormElement;

        async function submitForm(event: SubmitEvent): Promise<void> {
            event.preventDefault();

            const data: URLSearchParams = new URLSearchParams(new FormData(form) as never); // can be assigned by spec.
            const emptyInputs: string[] = [];

            for (const [key, value] of data) {
                 if (value.length <= 0)
                     emptyInputs.push(key);
            }

            if (emptyInputs.length > 0) {
                setEmptyInputs(emptyInputs);
                return;
            }

            const result: ApiResponse<unknown> = await fetch("/api/auth/login", {
                body: data.toString(),
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }).then((r: Response) => r.json());

            if (!result.is_error) {
                location.assign("/personal");
                return;
            }

            setLoginStatus(result.reason!);
        }

        form.addEventListener("submit", submitForm);
        return (): void => form.removeEventListener("submit", submitForm);
    }, []);

    if (possibleUser) {
        location.assign("/personal");
        return <></>;
    }

    return <>
        <img className="logo" src="/api/config/logo" alt="logo"/>
        <div className="login-section">
            <h1>Login</h1>
            <form className="login-form" id="login-form">
                <div>
                    <Input
                        displayText="email"
                        type="email"
                        error={
                            emptyInputs.includes("email")
                                ? "An email is required."
                                : loginStatus == "USER_NOT_FOUND"
                                    ? "Unknown user."
                                    : undefined
                        }
                    />
                </div>
                <div>
                    <Input
                        displayText="password"
                        type="password"
                        error={
                            emptyInputs.includes("password")
                                ? "A password is required."
                                : loginStatus == "INCORRECT_PASSWORD"
                                    ? "Incorrect password."
                                    : undefined
                        }
                    />
                </div>
                <input type="submit" value="Login" className="button"/>
            </form>
        </div>
    </>
}
