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

import React, { FC, useMemo } from "react";
import { ICellEditor } from "../../editors";
import { ICellRender } from "../";

const TextCellRenderer: FC<ICellRender> = (props) => {
    const castedCellEditor = props.columnMetaData.cellEditor as ICellEditor;

    const displayTextValue = useMemo(() => {
        if (props.cellData !== null) {
            if (castedCellEditor.contentType === "text/plain;password") {
                return '\u25CF'.repeat(props.cellData.length);
            }
        }
        return props.cellData
    }, [props.cellData, castedCellEditor.contentType]);

    return (
        <>
            <div className="cell-data-content">
                {props.icon ?? props.cellData?.includes("<html>") ? <span dangerouslySetInnerHTML={{ __html: props.cellData as string }}/> : displayTextValue}
            </div>
        </>
    )
}
export default TextCellRenderer
