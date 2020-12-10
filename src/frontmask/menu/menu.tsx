//React
import React, {FC, useContext, useEffect, useRef, useState} from "react";

//Custom
import './menu.scss';
import {createLogoutRequest} from "../../JVX/factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../JVX/request/REQUEST_ENDPOINTS";
import MenuItemCustom from "../../primeExtension/MenuItemCustom";
import {jvxContext} from "../../JVX/jvxProvider";

//Prime
import {Menubar} from "primereact/menubar";
import {SlideMenu} from "primereact/slidemenu";
import {MenuItem} from "primereact/api";
import {Button} from "primereact/button";
import {serverMenuButtons} from "../../JVX/response/MenuResponse";
import { parseIconData } from "../../JVX/components/compprops/ComponentProperties";

const Menu: FC = () => {
    const context = useContext(jvxContext);
    const [menuItems, changeMenuItems] = useState<Array<MenuItemCustom>>();
    const slideRef = useRef<SlideMenu>(null)

    const profileMenu = () => {
        const sendLogout = () => {
            const logoutRequest = createLogoutRequest();
            localStorage.removeItem("authKey")
            context.contentStore.reset();
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
    }

    useEffect(()=> {
        const receiveNewMenuItems = (menuGroup: Map<string, Array<serverMenuButtons>>) => {
            const primeMenu = new Array<MenuItem>();
            menuGroup.forEach((value, key) => {
                const primeMenuItem: MenuItem = {
                    label: key,
                    items: value.map(menuItems => {
                       const iconData = parseIconData(undefined, menuItems.image)
                       const subMenuItem: MenuItemCustom = {
                           command: e => menuItems.action(),
                           label: menuItems.text,
                           componentId: menuItems.componentId,
                           icon: iconData.icon
                       }
                       return subMenuItem
                    })
                }
                primeMenu.push(primeMenuItem);
            });
            changeMenuItems(primeMenu)
        }
        receiveNewMenuItems(context.contentStore.mergedMenuItems);
        context.contentStore.subscribeToMenuChange(receiveNewMenuItems);

        return () => {
            context.contentStore.unsubscribeFromMenuChange(receiveNewMenuItems)
        }
    }, [context.contentStore]);

    console.log(process.env.PUBLIC_URL)

    return(
        <div className="topMenuBar p-grid">
            <Menubar start={() => <img src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.contentStore.LOGO} alt="logo" style={{marginRight: '20px'}}/>} model={menuItems} className="p-col" end={() => profileMenu()}/>
        </div>
    )
}
export default Menu;