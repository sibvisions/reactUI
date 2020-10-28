//React
import React, {FC, useContext, useEffect, useMemo, useRef, useState} from "react";

//Custom
import './menu.scss';
import {createLogoutRequest, createOpenScreenRequest} from "../../JVX/factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../JVX/request/REQUEST_ENDPOINTS";
import MenuItemCustom from "../../primeExtension/MenuItemCustom";
import {jvxContext} from "../../JVX/jvxProvider";
import logo from '../../assests/sibvisionslogo.png'
import BaseResponse from '../../JVX/response/BaseResponse'

//Prime
import {Menubar} from "primereact/menubar";
import {SlideMenu} from "primereact/slidemenu";
import {MenuItem} from "primereact/api";
import {Sidebar} from 'primereact/sidebar';
import {TieredMenu} from 'primereact/tieredmenu';
import {Button} from "primereact/button";
import UserData from "../../JVX/model/UserData";

const Menu: FC = () => {
    const context = useContext(jvxContext);
    const [menuItems, changeMenuItems] = useState<Array<MenuItemCustom>>();
    const [sbVisible, setSbVisible] = useState<boolean>(false);
    const slideRef = useRef<SlideMenu>(null)

    const profileMenu = useMemo(() => {

        // Profile Menu
        const sendLogout = () => {
            const logoutRequest = createLogoutRequest();
            localStorage.removeItem("authKey")
            context.contentStore.currentUser = new UserData()
            context.contentStore.flatContent.clear();
            context.contentStore.removedContent.clear();
            context.server.sendRequest(logoutRequest, REQUEST_ENDPOINTS.LOGOUT);
        }
        const slideOptions: Array<MenuItem> =
            [
                {
                    label: "Settings",
                    icon: "pi pi-cog",
                    command: () => {
                        context.server.routingDecider([{name: "settings"}])
                    }
                },
                {
                    label: "Logout",
                    icon: "pi pi-power-off",
                    command(e: { originalEvent: Event; item: MenuItem }) {
                        sendLogout()
                    }
                }
            ]

        const image = () => {
            if(context.contentStore.currentUser.profileImage){
                return (
                    <img
                        alt={"profileImage"}
                        onClick={event => slideRef.current?.show(event)}
                        src={"data:image/jpeg;base64,"+ context.contentStore.currentUser.profileImage}
                        style={context.contentStore.currentUser.profileImage ? {height:50, width:50, borderRadius: 25} : undefined}
                    />
                )
            } else {
                return undefined
            }
        }

        return(
            <div style={{display: "flex"}}>
                <Button
                    className={"p-button-secondary p-button-text"}
                    label={context.contentStore.currentUser.displayName}
                    icon="pi pi-angle-down"
                    iconPos="right"
                    onClick={event => slideRef.current?.show(event)}/>
                <SlideMenu
                    ref={slideRef}
                    model={slideOptions}
                    popup={true}/>
                { image() }

            </div>
        )
    }, [slideRef , context.contentStore.currentUser, context.contentStore.flatContent, context.contentStore.removedContent, context.server])

    useEffect(()=> {
        const menuSubscription= context.contentStore.menuSubject.subscribe((menuItems: Array<MenuItemCustom>) => {
            menuItems.forEach(parent => {
                parent.items?.forEach(setAction)
            });
            changeMenuItems(menuItems);
        })
        return (() => {
            menuSubscription.unsubscribe();
        });
    });

    const setAction = (item: MenuItemCustom | MenuItemCustom[]) => {
        if(item instanceof Array){

        } else {
            item.command = (event) => {
                let btnReq = createOpenScreenRequest();
                if(item.componentId){
                    btnReq.componentId = item.componentId;
                    context.server.sendRequest(btnReq, REQUEST_ENDPOINTS.OPEN_SCREEN)
                }
            }
        }
    }

    return(
        <>
            <div className="topMenuBar p-grid">
                <Menubar start={() => <img src={logo}/>} model={menuItems} className="p-col" end={() => profileMenu}/>
            </div>
            <Sidebar visible={sbVisible} position="left" onHide={() => setSbVisible(false)}>
                <TieredMenu className="sidebar-menu" model={menuItems}/>
            </Sidebar>
        </>
    )
}
export default Menu;