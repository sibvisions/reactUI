//React
import React, {FC, useContext, useEffect, useRef, useState} from "react";

//Custom
import {createLogoutRequest} from "../../JVX/factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../JVX/request/REQUEST_ENDPOINTS";
import MenuItemCustom from "../../primeExtension/MenuItemCustom";
import {jvxContext} from "../../JVX/jvxProvider";

//Prime
import { PanelMenu } from 'primereact/panelmenu';
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
                        className="profileImage"
                        alt={"profileImage"}
                        onClick={event => slideRef.current?.show(event)}
                        src={"data:image/jpeg;base64,"+ context.contentStore.currentUser.profileImage}
                    />
                )
            } else {
                return (
                    <span className="profileCircle">
                        <i className="noProfileImage fa fa-user"/>
                    </span>
                )
            }
        }

        return(
            <div className="profileMenu">
                <Button
                    className="profileName"
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

    const handleToggleClick = () => {
        console.log('toggler has been clicked')
    }

    return(
        <div className="menu">
            <div className="topMenuBar">
                <div className="logoWrap">
                    <img className="logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.contentStore.LOGO} alt="logo" />
                </div>
                <i onClick={handleToggleClick} className="menuToggler pi pi-bars" />
                {profileMenu()}
                {/* <Menubar start={() => <img src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.contentStore.LOGO} alt="logo" style={{marginRight: '20px'}}/>} model={menuItems} className="p-col" end={() => profileMenu()}/> */}
            </div>
            <div className="menuWrap">
                <PanelMenu model={menuItems} />
            </div>
        </div>
    )
}
export default Menu;