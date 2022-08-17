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

// Interface for extendable-choice-cell-editor
export interface IExtendableChoiceEditor {
    onClick?(e: SyntheticEvent|React.KeyboardEvent<HTMLSpanElement>): void,
    onChange?(e: {
        value: any,
        allowedValues: any[]
    }): void
}

// This component is an empty substitute for the component UIEditorChoice
const ExtendChoiceEditor: FC<IExtendableChoiceEditor> = () => {
    return (
        <>
        </>
    )
}
export default ExtendChoiceEditor