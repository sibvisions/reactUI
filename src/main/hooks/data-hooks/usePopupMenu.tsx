/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { createContext, PropsWithChildren, FC, useContext, useCallback, useState, useRef, SyntheticEvent } from "react";
import { ContextMenu } from 'primereact/contextmenu';
import { createComponentRequest, getClientId } from "../../../moduleIndex";
import BaseComponent from "../../util/types/BaseComponent";
import { MenuItem } from "primereact/menuitem";
import { parseIconData } from "../../components/comp-props";
import { createDispatchActionRequest } from "../../factories/RequestFactory";
import { REQUEST_KEYWORDS } from "../../request";
import { appContext } from "../../AppProvider";

type ShowPopupFn = (id: string) => void;
type HidePopupFn = () => void;

const PopupContext = createContext<{
    showPopup: ShowPopupFn;
    hidePopup: HidePopupFn;
    onContextMenu: (e: SyntheticEvent) => void;
}>({
    showPopup: () => {},
    hidePopup: () => {},
    onContextMenu: () => {},
});

function makeMenu(flatItems: Map<string, BaseComponent>, parent: string, context: any): MenuItem[] {
    return Array.from(flatItems.values())
        .filter(item => item.parent === parent)
        .map(item => {
            switch(item.className) {
                case "Separator":
                    return {
                        separator: true
                    }
                default:
                    const items = makeMenu(flatItems, item.id, context);
                    let iconProps = parseIconData("inherit", item.image);
                    return {
                        label: item.text,
                        icon: iconProps ? iconProps.icon : undefined,
                        style: {
                            color: iconProps.color
                        },
                        color: iconProps.color,
                        command: () => {
                            const req = createDispatchActionRequest();
                            req.componentId = item.name;
                            context.server.sendRequest(req, REQUEST_KEYWORDS.PRESS_BUTTON);
                        },
                        ...(items.length ? { items } : {})
                    }
            }
        })
    
}

export const PopupContextProvider:FC<PropsWithChildren<{}>> = ({children}) => {
    const context = useContext(appContext);
    const lastEvent = useRef<SyntheticEvent>();
    const contextMenu = useRef<ContextMenu>();
    const [model, setModel] = useState<any>([{
        label:'Hello World',
        icon:'pi pi-fw pi-external-link'
    }]);
    const popup = useRef<string>();
    const showPopup = useCallback<ShowPopupFn>((id) => {
        if (id !== popup.current && lastEvent.current) {
            setModel(makeMenu(context.contentStore.flatContent, id, context));
            contextMenu.current?.show(lastEvent.current);
            popup.current = id;
            lastEvent.current = undefined;
        }
    }, []);
    const hidePopup = useCallback<HidePopupFn>(() => {
        if (popup.current && lastEvent.current) {
            contextMenu.current?.hide(lastEvent.current);
            popup.current = undefined;
            lastEvent.current = undefined;
        }
    }, []);
    const onHide = useCallback(() => {
        if(popup.current) {
            context.server.sendRequest(createComponentRequest({
                componentId: context.contentStore.flatContent.get(popup.current)?.name, 
                clientId: getClientId()
            }), REQUEST_KEYWORDS.CLOSE_POPUP_MENU);
            popup.current = undefined;
            lastEvent.current = undefined;
        }
    }, []);

    return <>
        <PopupContext.Provider value={{
            showPopup,
            hidePopup,
            onContextMenu: (e) => {
                e.stopPropagation();
                e.preventDefault();
                e.persist();
                lastEvent.current = e;
            }
        }}>
            {children}
        </PopupContext.Provider>
        <ContextMenu 
            ref={contextMenu as any}
            model={model}
            onHide={onHide}
        />
    </>
}

export const usePopupMenu = (props: any) => {
    const popupContext = useContext(PopupContext);

    if(!props.hasOwnProperty("popupMenu")) {
        return {};
    }

    const { popupMenu } = props;
    if (popupMenu) {
        popupContext.showPopup(popupMenu);
    } else {
        popupContext.hidePopup();
    }

    return {
        onContextMenu: popupContext.onContextMenu
    }
}

export default usePopupMenu;