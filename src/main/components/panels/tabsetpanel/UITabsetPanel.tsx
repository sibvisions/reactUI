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

import React, { FC, useCallback, useRef } from "react"
import { IExtendableTabsetPanel } from "../../../extend-components/panels/ExtendTabsetPanel";
import { createTabRequest } from "../../../factories/RequestFactory";
import useComponentConstants from "../../../hooks/components-hooks/useComponentConstants";
import useComponents from "../../../hooks/components-hooks/useComponents";
import REQUEST_KEYWORDS from "../../../request/REQUEST_KEYWORDS";
import IconProps from "../../comp-props/IconProps";
import { showTopBar } from "../../topbar/TopBar";
import { IPanel } from "../panel/UIPanel";
import TabsetPanelImpl from "./TabsetPanelImpl";

/** Interface for TabsetPanel */
export interface ITabsetPanel extends IPanel {
    selectedIndex?: number;
}

// Type for a tabs properties
export type TabProperties = {
    enabled: boolean
    closable: boolean
    text: string
    icon?: IconProps
}

/**
 * This component handles the selection and closure of tabs and calls the TabsetImpl component to render the TabsetPanel
 * @param baseProps - the properties sent by the Layout component
 */
const UITabsetPanel: FC<ITabsetPanel & IExtendableTabsetPanel> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props], layoutStyle, compStyle] = useComponentConstants<ITabsetPanel & IExtendableTabsetPanel>(baseProps, {visibility: 'hidden'});

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [, components, compSizes] = useComponents(baseProps.id, props.className);

    /** Reference value if there is currently a tab closing action */
    const closing = useRef(false);

    /** Sets up a TabsetPanelRequest which will be sent to the server either selectTab or closeTab*/
    const buildTabRequest = useCallback((tabId:number) => {
        const req = createTabRequest();
        req.componentId = props.name;
        req.index = tabId;
        return req
    },[props.name])

    // When a Tab is not closing and the user clicks on another Tab which is not disabled, send a selectTabRequest to the server
    // If the lib user extends the TabsetPanel with onTabChange, call it when the selected-tab changes.
    const handleSelect = (tabId:number) => {
        if(!closing.current) {
            if (props.onTabChange) {
                props.onTabChange(tabId);
            } 

            showTopBar(context.server.sendRequest(buildTabRequest(tabId), REQUEST_KEYWORDS.SELECT_TAB), topbar);
        }
        closing.current = false;
    }

    // When a tab is closed send a tabCloseRequest to the server
    // If the lib user extends the TabsetPanel with onTabClose, call it when a tab closes.
    const handleClose = (tabId:number) => {
        if (props.onTabClose) {
            props.onTabClose(tabId);
        }
        
        showTopBar(context.server.sendRequest(buildTabRequest(tabId), REQUEST_KEYWORDS.CLOSE_TAB), topbar);
        closing.current = true
    }

    return (
        <TabsetPanelImpl
            {...props}
            components={components} 
            compSizes={compSizes} 
            compStyle={compStyle}
            layoutStyle={layoutStyle}
            onTabChange={handleSelect}
            onTabClose={handleClose}
            style={props.style} />
    )
}
export default UITabsetPanel