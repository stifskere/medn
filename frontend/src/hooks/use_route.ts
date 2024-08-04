import {ReactElement} from "react";

interface Route {
    title: string;
    path: string;
    handler: ReactElement;
}

interface Redirect {
    path: string;
    to: string;
}

interface RouterSpec {
    routes: (Route | Redirect)[];
    not_found: ReactElement;
}

export type SelectedRoute = Omit<Route, "path">;

export default function useRoute({routes, not_found}: RouterSpec): SelectedRoute {
    for (const route of routes) {
        if (route.path === window.location.pathname) {
            if ("handler" in route) {
                return { handler: route.handler, title: route.title };
            } else {
                window.location.assign(route.to);
                return;
            }
        }
    }

    return { handler: not_found, title: "Not found" };
}