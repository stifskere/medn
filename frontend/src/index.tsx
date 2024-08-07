// noinspection JSUnusedLocalSymbols

import "./global.css";

import {ReactElement} from "react";
import {createRoot} from "react-dom/client";
import {toast, ToastContainer, Zoom} from "react-toastify";

import useRoute, {SelectedRoute} from "@hooks/use_route";
import useFetch, {FetchResponse} from "@hooks/use_fetch";

import NotFound from "@pages/not_found/page";
import Login from "@pages/login/page";
import Personal from "@pages/personal/page";

import "react-toastify/dist/ReactToastify.css";
import Shared from "@pages/shared/page";
import Settings from "@pages/settings/page";

function App(): ReactElement { 
    let themeCheck: FetchResponse = useFetch("/api/config/theme");
    let config: FetchResponse = useFetch("/api/config/data");
    let parsedConfig: ApiResponse<AppConfig> | undefined = config.code == 200 
        ? JSON.parse(config.body!) 
        : undefined;

    let route: SelectedRoute = useRoute({
        routes: [
            {
                path: "/",
                to: "/login"
            },
            {
                path: "/login",
                title: "Login",
                handler: <Login />
            },
            {
                path: "/personal",
                title: "Personal folder",
                handler: <Personal />
            },
            {
                path: "/shared",
                title: "Shared with me",
                handler: <Shared />
            },
            {
                path: "/settings",
                title: "External upload settings",
                handler: <Settings />
            }
        ],
        not_found: <NotFound />
    })

    if (parsedConfig !== undefined)
        document.title = `${parsedConfig.result!.name} - ${route.title}`;

    if (!themeCheck.has_reply || !config.has_reply)
        return <></>

    if (themeCheck.code != 200) {
        toast.error("Couldn't load a theme...", {
            position: "bottom-right",
            autoClose: 5000,
            pauseOnHover: true,
            theme: "dark",
            transition: Zoom,
            pauseOnFocusLoss: false
        });
    } else {
        const theme: HTMLLinkElement = document.createElement("link");
        theme.rel = "stylesheet";
        theme.href = "/api/config/theme";
        document.head.appendChild(theme);
    }

    return <>
        {route.handler}
        <ToastContainer/>
    </>;
}

createRoot(document.getElementById("root") as HTMLDivElement)
    .render(<App />);
