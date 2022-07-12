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

import React, { FC } from "react";

// Interface for extendable-date-cell-editor
export interface IExtendableDateEditor {
    onBlur?(e:React.FocusEvent): void,
    onInput?(e:KeyboardEvent): void,
    onChange?(value: Date | undefined): void
}

// This component is an empty substitute for the component UIEditorDate
const ExtendDateEditor: FC<IExtendableDateEditor> = () => {
    return (
        <>
        </>
    )
}
export default ExtendDateEditor