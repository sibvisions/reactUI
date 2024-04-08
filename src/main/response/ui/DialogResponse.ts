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
import MessageResponse from "./MessageResponse"

/** Interface for DialogResponse */
interface DialogResponse extends MessageResponse, ComponentResponse {
    iconType: 0|1|2|3|9|-1,
    buttonType: 4|5|6|7|8|-1,
    resizable?: boolean,
    closable?: boolean,
    okComponentId?: string,
    notOkComponentId?: string,
    cancelComponentId?: string
    okText?: string
    notOkText?: string
    cancelText?: string
    inputLabel?: string
    dataProvider?: string
    columnName?: string
}
export default DialogResponse