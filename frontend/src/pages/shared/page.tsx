import SideBar from "@components/sidebar/component";
import useUser, { User } from "@hooks/use_user";
import { ReactElement } from "react";


export default function Shared(): ReactElement {
    const user: null | undefined | User = useUser(true);

    if (user === null || user === undefined)
        return <></>;

    return <>
        <SideBar user={user}/>
    </>;
}
