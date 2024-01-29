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

import React, { createContext, FC } from "react";

/** Interface for the ResizeContext. Contains information for the Resizehandler to calculate the screen-sizes */
export interface IResizeContext {
    menuSize?:number,
    menuRef?: any,
    login?:boolean,
    menuCollapsed?:boolean,
    mobileStandard?:boolean,
    setMobileStandard?: Function,
    children?: React.ReactNode
}

// Creates a resize-context which contains various properties for the resizehandler
export const ResizeContext = createContext<IResizeContext>({});

// This component provides the resize-context
const ResizeProvider: FC<IResizeContext> = (props) => {
    return (
        <ResizeContext.Provider value={{ login: props.login, menuRef: props.menuRef, menuSize: props.menuSize, menuCollapsed: props.menuCollapsed, mobileStandard: props.mobileStandard, setMobileStandard: props.setMobileStandard }}>
            {props.children}
        </ResizeContext.Provider>
    )
}
export default ResizeProvider