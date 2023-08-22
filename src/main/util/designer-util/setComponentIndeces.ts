/* Copyright 2023 SIB Visions GmbH
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

import { BorderLayoutInformation, FlowLayoutInformation, FormLayoutInformation, GridLayoutInformation, NullLayoutInformation } from "../types/designer/LayoutInformation";

/**
 * Sets the indeces of the components to the designers layoutsinfo
 * @param layoutInfo - the information of the layout
 * @param name - the name of the component
 * @param indexOf - the indexOf property of the compoent
 */
export function setComponentIndeces(layoutInfo: FormLayoutInformation|BorderLayoutInformation|FlowLayoutInformation|GridLayoutInformation|NullLayoutInformation|null, name: string, indexOf:number|undefined) {
    if (layoutInfo && indexOf !== undefined) {
        if (layoutInfo.componentIndeces.includes(name)) {
            const index = layoutInfo.componentIndeces.findIndex((compName: string) => compName === name);
            if (index !== -1) {
                layoutInfo.componentIndeces.splice(index, 1);
            }
        }
        layoutInfo.componentIndeces.splice(indexOf, 0, name);
    }
}