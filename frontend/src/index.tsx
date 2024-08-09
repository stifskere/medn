import "./global.css";

import {ReactElement, useEffect} from "react";
import {createRoot} from "react-dom/client";

import useRoute, {SelectedRoute} from "@hooks/use_route";
import useFetch, {FetchResponse} from "@hooks/use_fetch";
import useNotifications, {NotifInterface} from "@hooks/use_notifications";

import NotFound from "@pages/not_found/page";
import Login from "@pages/login/page";
import Personal from "@pages/personal/page";
import Shared from "@pages/shared/page";
import Settings from "@pages/settings/page";

import { AppServices } from "./utils";

import { LuXCircle } from "react-icons/lu";

function App(): ReactElement { 
    let themeCheck: FetchResponse = useFetch("/api/config/theme");
    let config: FetchResponse = useFetch("/api/config/data");
    let [component, queueNotification]: NotifInterface = useNotifications();

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

    useEffect((): void => {
        if (!themeCheck.has_reply)
            return;

        if (themeCheck.code != 200) {
            queueNotification({
                title: "Server error",
                content: "There was an error while loading a theme.",
                icon: <LuXCircle />
            });
        } else {
            const theme: HTMLLinkElement = document.createElement("link");
            theme.rel = "stylesheet";
            theme.href = "/api/config/theme";
            document.head.appendChild(theme);
        }
    }, [themeCheck]);

    useEffect((): void => {
        if (!config.has_reply)
            return;

        if (config.code != 200) {
            queueNotification({
                title: "Server error",
                content: "There was an error while loading server configuration.",
                icon: <LuXCircle />
            });

            return;
        }

        let parsedConfig: AppConfig 
            = (JSON.parse(config.body!) as ApiResponse<AppConfig>)
                .result!;

        document.title = `${parsedConfig.name} - ${route.title}`;
    }, [config]);

    return <AppServices.Provider value={{ queueNotification }}>
        {component}
        {route.handler}
    </AppServices.Provider>;
}

createRoot(document.getElementById("root") as HTMLDivElement)
    .render(<App />);
