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

import React, { createContext, PropsWithChildren, FC, useContext, useCallback, useState, useRef, SyntheticEvent, useEffect } from "react";
import { ContextMenu } from 'primereact/contextmenu';
import BaseComponent from "../../util/types/BaseComponent";
import { MenuItem } from "primereact/menuitem";
import { createComponentRequest, createDispatchActionRequest, getClientId } from "../../factories/RequestFactory";
import { appContext } from "../../contexts/AppProvider";
import { parseIconData } from "../../components/comp-props/ComponentProperties";
import REQUEST_KEYWORDS from "../../request/REQUEST_KEYWORDS";

type ShowPopupFn = (id: string) => void;
type HidePopupFn = () => void;
type SetLastEventFn = (e: SyntheticEvent) => void;

// Creates a popup-context with functions to show and hide the menu and an event function
const PopupContext = createContext<{
    showPopup: ShowPopupFn;
    hidePopup: HidePopupFn;
    setLastEvent: SetLastEventFn;
    onContextMenu: (e: SyntheticEvent) => void;
}>({
    showPopup: () => {},
    hidePopup: () => {},
    setLastEvent: () => {},
    onContextMenu: () => {},
});

// Creates the popupmenu
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
                        disabled: item.enabled === false,
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

// Provides the popup-context to its children
export const PopupContextProvider:FC<PropsWithChildren<{}>> = ({children}) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Reference for the last event */
    const lastEvent = useRef<SyntheticEvent>();

    /** Reference for the context menu */
    const contextMenu = useRef<ContextMenu>();

    /** State of the popup-menu-item-model */
    const [model, setModel] = useState<any>([{
        label:'Hello World',
        icon:'pi pi-fw pi-external-link'
    }]);

    /** Reference which popup is currently opened */
    const popup = useRef<string>();

    const setLastEvent = useCallback<SetLastEventFn>((e) => {
        lastEvent.current = e;
    }, []);

    // Sets the model and shows the popup if the given id is not the current popup id and the lastEvent isn't null
    const showPopup = useCallback<ShowPopupFn>((id) => {
        if (lastEvent.current) {
            setModel(makeMenu(context.contentStore.flatContent, id, context));
            contextMenu.current?.show(lastEvent.current);
            popup.current = id;
            lastEvent.current = undefined;
        }
    }, []);

    // Hides the popup if it is opened and the lastEvent isn't null
    const hidePopup = useCallback<HidePopupFn>(() => {
        if (popup.current && lastEvent.current) {
            contextMenu.current?.hide(lastEvent.current);
            popup.current = undefined;
            lastEvent.current = undefined;
        }
    }, []);

    // When the popup-menu hides, send a close-popup-menu-request to the server
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
            setLastEvent,
            onContextMenu: (e) => {
                e.stopPropagation();
                e.preventDefault();
                e.persist();
                if (lastEvent.current) {
                    contextMenu.current?.hide(lastEvent.current)
                }
                setLastEvent(e);
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

export const usePopupMenu = (props: any, lastEvent?: any) => {
    // Use the Popup-Context to use its functions
    const popupContext = useContext(PopupContext);

    const initial = useRef<boolean>(true)

    // end if the server sent no popup property
    if(!props.hasOwnProperty("popupMenu")) {
        return {};
    }

    if (initial.current) {
        popupContext.setLastEvent(lastEvent);
        initial.current = false;
    }
    

    // Show or hide popup
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