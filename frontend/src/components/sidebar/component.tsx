import {ChangeEvent, ReactElement} from "react";
import { 
    LuFolder, 
    LuFolderSymlink, 
    LuSettings,
    LuPowerOff,
    LuSearch,
    LuUser
} from "react-icons/lu";

import {User} from "@hooks/use_user";

import ProgressBar from "@components/progress/component";

import { formatBytes } from "../../utils";

import "./styles.css";


interface PageLinkProps {
    text: string;
    icon: ReactElement;
    href: string;
}

interface SideBarProps {
    user: User;
    onSearch?(input: string): void;
}

function PageLink({text, icon, href}: PageLinkProps): ReactElement {
    function onClick(): void {
        location.href = href;
    }

    return <div 
        className="sidebar-button" 
        data-current={(location.pathname === href).toString()}
        onClick={onClick}
    >
        {icon}
        <p>{text}</p>
    </div>;
}

export default function SideBar({user, onSearch}: SideBarProps): ReactElement {
    function updateSearch(event: ChangeEvent): void {
        if (onSearch !== undefined)
            onSearch((event.target as HTMLInputElement).value);
    }

    async function logOut(): Promise<void> {
        await fetch("/api/auth/logout");
        location.assign("/login");
    }

    return <>
        <aside className="sidebar">
            <img className="logo logo-sidebar" src="/api/config/logo" alt="logo"/>
            <div className="sidebar-nav">
                <div className="sidebar-search">
                    <input className="input" placeholder="Search..." onChange={updateSearch} />
                    <LuSearch />
                </div>
                <PageLink text="Personal" icon={<LuFolder />} href="/personal"/>
                <PageLink text="Shared with me" icon={<LuFolderSymlink />} href="/shared"/>
            </div>
            <div className="sidebar-profile">
                <div className="sidebar-profile-data">
                    <p><LuUser />{user.name}</p>
                    <ProgressBar current={user.used_storage} max={user.max_storage} />
                    <p>
                        Used {formatBytes(user.used_storage)} out of {formatBytes(user.max_storage)} available
                    </p>
                </div>
                <div>
                    <PageLink text="Settings" icon={<LuSettings />} href="/settings"/>
                    <div className="sidebar-button exit-button" onClick={logOut}>
                        <LuPowerOff />
                        <p>Log Out</p>
                    </div>
                </div>
            </div>
        </aside>
    </>;
}
