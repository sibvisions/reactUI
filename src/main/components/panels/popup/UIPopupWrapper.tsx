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

import React, { CSSProperties, FC, ReactElement, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Dialog } from 'primereact/dialog';
import { appContext } from "../../../contexts/AppProvider";
import { createCloseContentRequest, createCloseScreenRequest } from "../../../factories/RequestFactory";
import { IPanel } from "../panel/UIPanel";
import REQUEST_KEYWORDS from "../../../request/REQUEST_KEYWORDS";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { IExtendablePopup } from "../../../extend-components/panels/ExtendPopupWrapper";
import { LayoutContext } from "../../../LayoutContext";
import _ from "underscore";
import useComponents from "../../../hooks/components-hooks/useComponents";
import Dimension from "../../../util/types/Dimension";
import Server from "../../../server/Server";
import { parsePrefSize } from "../../../util/component-util/SizeUtil";
import RESPONSE_NAMES from "../../../response/RESPONSE_NAMES";
import COMPONENT_CLASSNAMES from "../../COMPONENT_CLASSNAMES";
import CELLEDITOR_CLASSNAMES from "../../editors/CELLEDITOR_CLASSNAMES";
import useProperties from "../../../hooks/data-hooks/useProperties";

/** Interface for Popup */
export interface IPopup extends IPanel {
    render: ReactElement;
    popupId: string
}

/**
 * Component which is a wrapper for a Panel if it is a PopupPanel
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIPopupWrapper: FC<IPopup & IExtendablePopup> = (baseProps) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Live properties of the popup */
    const [props] = useProperties<IPopup>(baseProps.popupId, baseProps);

    /** Live properties of the panel below the popup */
    const [childProperties] = useProperties<IPanel>(baseProps.id, baseProps, true);

    /** The current app-theme e.g. "basti" */
    const [appTheme, setAppTheme] = useState<string>(context.appSettings.applicationMetaData.applicationTheme.value);

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [, , componentSizes] = useComponents(props.popupId, props.className);

    /** Current state of the size of the popup-container*/
    const [componentSize, setComponentSize] = useState(new Map<string, CSSProperties>());

    /** Reference for the popup component */
    const popupRef = useRef<Dialog>(null)

    /** True, if the first popup size initialization has completed. */
    const [initializePopup, setInitializePopup] = useState<boolean>(false);

    /** True, if the popup is currently maximized */
    const [maximized, setMaximized] = useState<boolean>(false);

    /** Subscribes the resize-handler to the theme */
    useEffect(() => {
        context.subscriptions.subscribeToTheme("popup", (theme:string) => setAppTheme(theme));

        return () => {
            context.subscriptions.unsubscribeFromTheme("popup");
            setComponentSize(new Map<string, CSSProperties>())
        }
    }, [context.subscriptions]);

    /** When the Popup gets closed, send a closeScreenRequest to the server and call contentStore closeScreen or closeContent if it's a content */
    const handleOnHide = () => {
        if (baseProps.onClose) {
            baseProps.onClose();
        }

        const comp = context.contentStore.getComponentById(baseProps.id);
        if (comp) {
            if ((comp as IPanel).screen_modal_) {
                const csRequest = createCloseScreenRequest();
                csRequest.componentId = comp.name;
                context.server.sendRequest(csRequest, REQUEST_KEYWORDS.CLOSE_SCREEN).then(res => {
                    if (res[0] === undefined || res[0].name !== RESPONSE_NAMES.ERROR) {
                        if (context.transferType !== "full") {
                            context.server.lastClosedWasPopUp = true;
                        }
                        context.contentStore.closeScreen(comp.id, comp.name, true);
                    }
                });
            }
            else if ((comp as IPanel).content_modal_) {
                const ccRequest = createCloseContentRequest();
                ccRequest.componentId = comp.name;
                context.server.sendRequest(ccRequest, REQUEST_KEYWORDS.CLOSE_CONTENT).then(res => {
                    if (res[0] === undefined || res[0].name !== RESPONSE_NAMES.ERROR) {
                        if (context.transferType !== "full") {
                            context.server.lastClosedWasPopUp = true;
                            (context.server as Server).closeContent({ name: "closeContent", componentId: comp.name })
                        }
    
                        //context.contentStore.closeScreen(props.name, true);
                    }
                });
            }
    
            // Focus the last focused component after closing the dialog
            const lastFocusedComponent = context.contentStore.lastFocusedComponent
            if (lastFocusedComponent) {
                let componentToFocus = document.getElementById(lastFocusedComponent.id);
                if (componentToFocus) {
                    if ([COMPONENT_CLASSNAMES.CHECKBOX, COMPONENT_CLASSNAMES.RADIOBUTTON, CELLEDITOR_CLASSNAMES.CHECKBOX, CELLEDITOR_CLASSNAMES.LINKED].indexOf(lastFocusedComponent.className as COMPONENT_CLASSNAMES|CELLEDITOR_CLASSNAMES) !== -1) {
                        componentToFocus = componentToFocus.querySelector("input");
                        if (componentToFocus) {
                            componentToFocus.focus();
                        }
                    }
                    else if (lastFocusedComponent.className === COMPONENT_CLASSNAMES.POPUPMENUBUTTON) {
                        componentToFocus = componentToFocus.querySelector(".p-splitbutton-menubutton");
                        if (componentToFocus) {
                            componentToFocus.focus();
                        }
                    }
                    else {
                        componentToFocus.focus();
                    }
                }
            }
        }
        else {
            console.error("Closing of popup not possible, child is missing")
        }
    }

    /** Sets the initial size for the popup */
    const handleInitialSize = () => {
        if (popupRef.current && popupRef.current.getContent()) {
            const comp = context.contentStore.getComponentById(baseProps.id);
            if (comp) {
                const prefSize = parsePrefSize(comp.preferredSize);
                const sizeMap = new Map<string, CSSProperties>();
                if (prefSize) {
                    sizeMap.set(comp.id, { height: prefSize.height, width: prefSize.width });
                }
                else {
                    let popupSize:Dimension = { height: 0, width: 0 };
                    sizeMap.set(comp.id, { height: popupSize.height, width: popupSize.width });
                }
                
                setComponentSize(sizeMap);
                setInitializePopup(true);
            }
        }
    }

    /** 
     * After setting the initial size check and set the size of the panel which is being popped up.
     * If the popup frame (eg. header) is bigger than the panel, set the size of the panel-frame instead.
     */
    const handleAfterInitial = () => {
        const prefSize = parsePrefSize(props.preferredSize);
        const sizeMap = new Map<string, CSSProperties>();
        const comp = context.contentStore.getComponentById(baseProps.id);
        if (comp && popupRef.current && popupRef.current.getContent()) {
            if (componentSizes && componentSizes.has(comp.id)) {
                if (prefSize) {
                    sizeMap.set(comp.id, { height: prefSize.height, width: prefSize.width });
                }
                else {
                    let popupSize:Dimension = { height: popupRef.current.getContent()!.offsetHeight, width: popupRef.current.getContent()!.offsetWidth}
                    const compSize = componentSizes.get(comp.id);
                    popupSize.height = popupSize.height > compSize!.preferredSize.height ? popupSize.height : compSize!.preferredSize.height;
                    popupSize.width = popupSize.width > compSize!.preferredSize.width ? popupSize.width : compSize!.preferredSize.width;
                    sizeMap.set(comp.id, { height: popupSize.height, width: popupSize.width });
                }
                setComponentSize(sizeMap);
                //setInitializeCompSizes(true);
            }
        }
        setInitializePopup(true);
    }

    /** When the popup is being resized update the size to resize the panel */
    const handlePopupResize = () => {
        const comp = context.contentStore.getComponentById(baseProps.id);
        if (comp && popupRef.current && popupRef.current.getContent()) {
            const sizeMap = new Map<string, CSSProperties>();
            const popupSize:Dimension = { height: popupRef.current.getContent()!.offsetHeight, width: popupRef.current.getContent()!.offsetWidth };
            sizeMap.set(comp.id, { height: popupSize.height, width: popupSize.width });
            setComponentSize(sizeMap);
        }
    }

    /** When resizing debounce the resize function so it doesn't get called too often */
    const handleResize = useCallback(_.debounce(handlePopupResize, 50), [handlePopupResize, popupRef.current]);

    useEffect(() => {
        if (!initializePopup && !componentSizes) {
            handleInitialSize();
        }
        else if (componentSizes) {
            handleAfterInitial();
        }
    }, [componentSizes]);

    // Calls lib-user events onDragStart, onDrag, onDragEnd if there are any
    return (
        <LayoutContext.Provider value={componentSize}>
            <Dialog
                className={concatClassnames("rc-popup", props.style, appTheme, 'reactUI')}
                header={props.screen_title_ || props.content_title_}
                visible={props.screen_modal_ || props.content_modal_}
                onDrag={(e) => baseProps.onDrag ? baseProps.onDrag(e) : undefined}
                onDragStart={(e) => baseProps.onDragStart ? baseProps.onDragStart(e) : undefined}
                onDragEnd={(e) => baseProps.onDragEnd ? baseProps.onDragEnd(e) : undefined}
                onHide={handleOnHide}
                baseZIndex={1010}
                ref={popupRef}
                //onShow={() => handleInitialSize()}
                resizable={props.screen_resizable_ || props.content_resizable_}
                closable={props.screen_closable_ || props.content_closable_}
                maximized={maximized}
                maximizable={props.screen_maximizable_ || props.content_maximizable_}
                onMaximize={(e) => {
                    setMaximized(e.maximized);
                    setTimeout(() => handlePopupResize(), 0)
                    
                }}
                onResize={() => handleResize()}
                closeOnEscape={false}
                >
                {React.cloneElement(baseProps.render, childProperties)}
            </Dialog>
        </LayoutContext.Provider>
    )
}
export default UIPopupWrapper