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

import React, { FC, useContext, useEffect, useMemo } from "react";
import { appContext } from "../../../contexts/AppProvider";
import useDataProviderData from "../../../hooks/data-hooks/useDataProviderData";
import { fetchLinkedRefDatabook, ICellEditorLinked } from "../../editors/linked/UIEditorLinked";
import { ICellRender } from "../CellEditor";

const LinkedCellRenderer: FC<ICellRender> = (props) => {
    const castedCellEditor = props.columnMetaData.cellEditor as ICellEditorLinked

    /** The data provided by the databook */
    const [providedData] = useDataProviderData(props.screenName, castedCellEditor.linkReference.referencedDataBook||"");

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** True if the linkRef has already been fetched */
    const linkRefFetchFlag = useMemo(() => providedData.length > 0, [providedData]);

    useEffect(() => {
        if (props.cellData) {
            fetchLinkedRefDatabook(
                props.screenName, 
                castedCellEditor.linkReference.referencedDataBook, 
                props.cellData, 
                castedCellEditor.displayReferencedColumnName,
                context.server,
                context.contentStore
            );
        }
    }, []);

    /** A map which stores the referenced-column-values as keys and the display-values as value */
    const displayValueMap = useMemo(() => {
        const map = new Map<string, string>();
        if (providedData.length && castedCellEditor.displayReferencedColumnName) {
            providedData.forEach((data:any) => map.set(
                data[castedCellEditor.linkReference.referencedColumnNames[0]], 
                data[castedCellEditor.displayReferencedColumnName as string]
            ))
        }
        return map;
    }, [linkRefFetchFlag]);

    const linkedDisplayValue = useMemo(() => {
        if (castedCellEditor.displayReferencedColumnName) {
            if (displayValueMap.has(props.cellData)) {
                return displayValueMap.get(props.cellData);
            }
            else {
                return "";
            }
        }
        return props.cellData
    }, [props.cellData, linkRefFetchFlag]);

    return (
        <>
            <div className="cell-data-content">
                {props.icon ?? linkedDisplayValue}
            </div>
            <div style={{ display: document.getElementById(props.screenName)?.style.visibility === "hidden" ? "none" : undefined, marginLeft: "auto" }} tabIndex={-1} onClick={props.stateCallback !== undefined ? () => (props.stateCallback as Function)() : undefined} >
                <i className="pi pi-chevron-down cell-editor-arrow" />
            </div>
        </>
    )
}
export default LinkedCellRenderer