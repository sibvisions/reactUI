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

import IBaseComponent from "../types/IBaseComponent";
import COMPONENT_CLASSNAMES from "../../components/COMPONENT_CLASSNAMES";
import { ITextField } from "../../components/text/UIText";

/**
 * Returns true, if the component is disabled
 * @param props - the properties of the component
 */
export function isCompDisabled(props:IBaseComponent) {
    if([COMPONENT_CLASSNAMES.TEXTFIELD, COMPONENT_CLASSNAMES.TEXTAREA, COMPONENT_CLASSNAMES.PASSWORD].indexOf(props.className as COMPONENT_CLASSNAMES) !== -1) {
        const castedProps = {...props} as ITextField
        return castedProps.enabled === false || castedProps.editable === false;
    }
    else {
        return props.enabled === false
    }
}