//React
import React, {FC, useContext, useEffect, useState} from "react";

//Custom
import {createOpenScreenRequest} from "../../JVX/factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../JVX/request/REQUEST_ENDPOINTS";
import MenuItemCustom from "../../primeExtension/MenuItemCustom";
import {jvxContext} from "../../JVX/jvxProvider";

//Prime
import {Menubar} from "primereact/menubar";

const Menu: FC = () => {
    const context = useContext(jvxContext);
    const [menuItems, changeMenuItems] = useState<Array<MenuItemCustom>>();

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
        <Menubar model={menuItems}/>
    )
}
export default Menu;