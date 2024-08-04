import { ReactElement } from "react";

import "./page.tsx";

import useUser, { User } from "@hooks/use_user";

import SideBar from "@components/sidebar/component";

export default function ApiSettings(): ReactElement {
    const user: null | undefined | User = useUser(true);

    if (user === null || user === undefined)
        return <></>;

    return <>
        <SideBar user={user} />
    </>;
}
