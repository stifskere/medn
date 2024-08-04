import {ReactElement} from "react";

import useUser, {User} from "@hooks/use_user";

import SideBar from "@components/sidebar/component";

import "./styles.css";

export default function Personal(): ReactElement {
    const user: User | null | undefined = useUser(true)!;

    if (user === null || user === undefined)
        return <></>;

    return <>
        <SideBar user={user} />
    </>;
}
