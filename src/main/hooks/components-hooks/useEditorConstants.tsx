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

import { CSSProperties, useMemo } from "react";
import useRowSelect from "../data-hooks/useRowSelect";
import useMetaData from "../data-hooks/useMetaData";
import useComponentConstants from "../components-hooks/useComponentConstants";
import useCellEditorStyle from "../style-hooks/useCellEditorStyle";
import { AppContextType } from "../../contexts/AppProvider";
import { IRCCellEditor } from "../../components/editors/CellEditorWrapper";
import { TopBarContextType } from "../../components/topbar/TopBar";
import CELLEDITOR_CLASSNAMES from "../../components/editors/CELLEDITOR_CLASSNAMES";
import { LengthBasedColumnDescription, NumericColumnDescription } from "../../response/data/MetaDataResponse";

/**
 * This hook returns constants for cell-editors
 * @param baseProps - the properties of the editor
 * @returns 
 */
const useEditorConstants = <T extends IRCCellEditor>(baseProps: T, fb?: CSSProperties): [
    AppContextType,
    TopBarContextType,
    [T],
    CSSProperties | undefined,
    string,
    NumericColumnDescription | LengthBasedColumnDescription | undefined,
    any,
    CSSProperties,
    string[]
] => {
    /** Component constants for contexts, properties and style */
    const [context, topbar, [props], layoutStyle, compStyle, styleClassNames] = useComponentConstants<T>(baseProps, fb);

    /** gets the cellstyle of a cell-editor */
    const cellStyle = useCellEditorStyle(props, compStyle);

    /** The component id of the screen */
    const screenName = useMemo(() => baseProps.isCellEditor ? context.server.getScreenName(baseProps.dataRow) : context.contentStore.getScreenName(props.id, props.dataRow) as string, [props.id, props.dataRow, baseProps.isCellEditor, baseProps.dataRow])

    /** The metadata for the specific column */
    const columnMetaData = useMetaData(screenName, props.dataRow, props.columnName, baseProps.cellEditor?.className === CELLEDITOR_CLASSNAMES.NUMBER ? "numeric" : undefined);

    /** The currently selected row */
    const [selectedRow] = useRowSelect(screenName, props.dataRow, props.isCellEditor && props.rowIndex ? props.rowIndex() : undefined);

    return [context, topbar, [props], layoutStyle, screenName, columnMetaData, [selectedRow], cellStyle, styleClassNames]
}
export default useEditorConstants