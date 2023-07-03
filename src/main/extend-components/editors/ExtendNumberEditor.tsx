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

import React, { FC, SyntheticEvent } from "react";

// Interface for extendable-number-cell-editor
export interface IExtendableNumberEditor {
    onBlur?(e:React.FocusEvent): void,
    onInput?(e: { originalEvent: SyntheticEvent, value: number | null }):void
    onChange?(value:number|string|null|undefined):void
}

// This component is an empty substitute for the component UIEditorNumber
const ExtendNumberEditor: FC<IExtendableNumberEditor> = () => {
    return (
        <>
        </>
    )
}
export default ExtendNumberEditor