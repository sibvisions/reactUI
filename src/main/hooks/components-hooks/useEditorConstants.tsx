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
import { useCellEditorStyle, useComponentConstants, useMetaData, useRowSelect } from "..";
import { AppContextType } from "../../AppProvider";
import { LengthBasedColumnDescription, NumericColumnDescription } from "../../response";
//import { CELLEDITOR_CLASSNAMES } from "../../components/editors";
import { IRCCellEditor } from "../../components/editors/CellEditorWrapper";
import { TopBarContextType } from "../../components/topbar/TopBar";
import CELLEDITOR_CLASSNAMES from "../../components/editors/CELLEDITOR_CLASSNAMES";

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
    Map<string, string>,
    string,
    NumericColumnDescription | LengthBasedColumnDescription | undefined,
    any,
    CSSProperties
] => {
    /** Component constants for contexts, properties and style */
    const [context, topbar, [props], layoutStyle, translations, compStyle] = useComponentConstants<T>(baseProps, fb);

    const cellStyle = useCellEditorStyle(props, compStyle);

    /** The component id of the screen */
    const screenName = useMemo(() => baseProps.isCellEditor ? baseProps.cellScreenName as string : context.contentStore.getScreenName(props.id, props.dataRow) as string, [props.id, props.dataRow, baseProps.isCellEditor, baseProps.cellScreenName])

    /** True, if the editor is a checkbox or a choice editor */
    const isCheckOrChoice = useMemo(() => (props.cellEditor?.className === CELLEDITOR_CLASSNAMES.CHOICE || props.cellEditor?.className === CELLEDITOR_CLASSNAMES.CHECKBOX), [props.cellEditor?.className]);

    /** The metadata for the specific column */
    const columnMetaData = useMetaData(screenName, props.dataRow, props.columnName, baseProps.cellEditor?.className === CELLEDITOR_CLASSNAMES.NUMBER ? "numeric" : undefined);

    /** The currently selected row */
    const [selectedRow] = useRowSelect(screenName, props.dataRow, props.columnName, isCheckOrChoice ? true : undefined, props.isCellEditor && props.rowIndex ? props.rowIndex() : undefined);

    return [context, topbar, [props], layoutStyle, translations, screenName, columnMetaData, [selectedRow], cellStyle]
}
export default useEditorConstants