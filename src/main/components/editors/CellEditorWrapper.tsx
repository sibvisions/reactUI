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

import { CSSProperties, FC, useMemo } from "react";
import { AppContextType } from "../../contexts/AppProvider";
import { createEditor } from "../../factories/UIFactory";
import useEditorConstants from "../../hooks/components-hooks/useEditorConstants";
import useFetchMissingData from "../../hooks/data-hooks/useFetchMissingData";
import { LengthBasedColumnDescription, NumericColumnDescription } from "../../response/data/MetaDataResponse";
import { translation } from "../../util/other-util/Translation";
import { CellFormatting, IInTableEditor } from "../table/CellEditor";
import { TopBarContextType } from "../topbar/TopBar";
import { IEditor } from "./IEditor";
import { isCellEditorReadOnly } from "./text/UIEditorText";
import useRepaintResizer from "../../hooks/designer-hooks/useRepaintResizer";
import { SelectFilter } from "../../request/data/SelectRowRequest";

/** Interface which contains values the CellEditorWrapper passes down to the CellEditor it renders */
export interface ICellEditorWrapperProps {
    context: AppContextType,
    topbar: TopBarContextType,
    layoutStyle?: CSSProperties,
    translation: Map<string, string>,
    screenName: string,
    columnMetaData: NumericColumnDescription | LengthBasedColumnDescription | undefined,
    selectedRow: any,
    cellStyle: CSSProperties,
    rowIndex?: Function,
    filter?: SelectFilter
    isReadOnly: boolean
    rowNumber: number
    cellFormatting?: CellFormatting[]
    colIndex?: number,
    styleClassNames: string[]
}

/** The complete interface for ReactUI CellEditors. It extends the server-sent properties, wrapper properties and in-table-properties */
export interface IRCCellEditor extends IEditor, ICellEditorWrapperProps, IInTableEditor {

}

/**
 * A Wrapper Component for CellEditors
 * @param baseProps - the properties of a component sent by the server
 */
const CellEditorWrapper:FC<any> = (props) => {
    /** Current state of the properties for the component sent by the server */
    const [screenName, columnMetaData, [selectedRow], cellStyle] = useEditorConstants<any>(props);

    // Fetches Data if dataprovider has not been fetched yet
    useFetchMissingData(screenName, props.dataRow);

    useRepaintResizer(props.name, props.layoutStyle);

    /** If the CellEditor is read-only */
    const isReadOnly = useMemo(() => (props.isReadOnly !== undefined && props.isCellEditor) ? props.isReadOnly : isCellEditorReadOnly(props), [props.isCellEditor, props.readonly, props.cellEditor_editable_, props.enabled, props.isReadOnly]);

    return createEditor(
        {
            ...props,
            translation: translation,
            screenName: screenName,
            columnMetaData: columnMetaData,
            selectedRow: selectedRow,
            cellStyle: cellStyle,
            isReadOnly: isReadOnly,
            cellFormatting: props.cellFormatting,
            colIndex: props.colIndex,
            filter: props.filter
        }
    );
}
export default CellEditorWrapper