//React
import React, {FC, useContext, useEffect, useMemo, useRef, useState} from "react";

//Custom
import {createLogoutRequest, createOpenScreenRequest} from "../../JVX/factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../JVX/request/REQUEST_ENDPOINTS";
import MenuItemCustom from "../../primeExtension/MenuItemCustom";
import {jvxContext} from "../../JVX/jvxProvider";

//Prime
import {Menubar} from "primereact/menubar";
import {SlideMenu} from "primereact/slidemenu";
import {MenuItem} from "primereact/api";
import {Button} from "primereact/button";
import UserData from "../../JVX/model/UserData";

const Menu: FC = () => {
    const context = useContext(jvxContext);
    const [menuItems, changeMenuItems] = useState<Array<MenuItemCustom>>();
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
                    label: "Logout",
                    command(e: { originalEvent: Event; item: MenuItem }) {
                        sendLogout()
                    }
                }
            ]

        return(
            <div style={{display: "flex"}}>
                <Button
                    className={"p-button-secondary p-button-text"}
                    label={context.contentStore.currentUser.displayName}
                    style={{marginRight: 7}}
                    onClick={event => slideRef.current?.show(event)}/>
                <SlideMenu
                    ref={slideRef}
                    model={slideOptions}
                    popup={true}/>
                <img
                    onClick={event => slideRef.current?.show(event)}
                    src={context.contentStore.currentUser.profileImage ? "data:image/jpeg;base64,"+ context.contentStore.currentUser.profileImage : undefined}
                    style={context.contentStore.currentUser.profileImage ? {height:50, width:50, borderRadius: 25} : undefined}
                />
            </div>
        )
    }, [slideRef , context.contentStore.currentUser])

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
        <Menubar
            model={menuItems}
            end={() => profileMenu}
            />
    )
}
export default Menu;