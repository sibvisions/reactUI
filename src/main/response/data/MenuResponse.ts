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

import ComponentResponse from "../ComponentResponse"

// Interface for a BaseMenuButton sent by the server
export interface BaseMenuButton {
    componentId: string,
    text: string,
    image:string,
    quickBarText?: string,
    sideBarText?: string,
    enabled?: boolean,
    className?: string
    navigationName?:string
    flat:boolean
    action?: () => Promise<any>
}

/** Interface for serverMenuButtons */
export interface ServerMenuButtons extends BaseMenuButton {
    group: string,
    action: () => Promise<any>
}

/** Interface for MenuResponse */
interface MenuResponse extends ComponentResponse {
    entries: Array<ServerMenuButtons>
    toolBarEntries: Array<BaseMenuButton>
}
export default MenuResponse