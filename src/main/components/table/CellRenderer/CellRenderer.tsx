/* Copyright 2023 SIB Visions GmbH
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

import React, { CSSProperties, FC, useCallback, useContext, useEffect, useMemo } from "react"
import CELLEDITOR_CLASSNAMES from "../../editors/CELLEDITOR_CLASSNAMES"
import DirectCellRenderer from "./DirectCellRenderer"
import ImageCellRenderer from "./ImageCellRenderer"
import DateCellRenderer from "./DateCellRenderer"
import LinkedCellRenderer from "./LinkedCellRenderer"
import NumberCellRenderer from "./NumberCellRenderer"
import TextCellRenderer from "./TextCellRenderer"
import { isFAIcon } from "../../../hooks/event-hooks/useButtonMouseImages"
import { appContext } from "../../../contexts/AppProvider"
import useMetaData from "../../../hooks/data-hooks/useMetaData"
import IconProps from "../../comp-props/IconProps"
import { CellFormatting } from "../CellEditor"
import { getFont, parseIconData } from "../../comp-props/ComponentProperties"
import { SelectedCellContext } from "../UITable"

export interface ICellRenderer {
    name:string
    screenName: string,
    cellData: any,
    cellId: string,
    dataProvider: string,
    dataProviderReadOnly?: boolean,
    colName: string,
    colIndex: number,
    primaryKeys: string[],
    rowData: any,
    rowNumber: number,
    cellFormatting?: Map<string, CellFormatting>,
    isHTML: boolean,
    setStoredClickEvent?: (value: React.SetStateAction<Function | undefined>) => void
    setEdit?: (value: React.SetStateAction<boolean>) => void,
    decreaseCallback?: Function|undefined
}

const CellRenderer: FC<ICellRenderer> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Context for the selected cell */
    const cellContext = useContext(SelectedCellContext);

    /** Metadata of the columns */
    const columnMetaData = useMetaData(props.screenName, props.dataProvider, props.colName);

    const cellStyles: { cellStyle: CSSProperties, cellClassNames: string[], cellIcon: IconProps | null } = useMemo(() => {
        let cellStyle:any = { };
        const cellClassNames:string[] = ['cell-data', props.isHTML ? "html-cell" : ""];
        let cellIcon: IconProps | null = null;
    
        // Fills cell-classnames and cell-style based on the server-sent properties
        if (props.cellFormatting && props.cellFormatting.has(props.colName)) {
            const cellFormat = props.cellFormatting.get(props.colName) as CellFormatting
            if (cellFormat !== null) {
                if(cellFormat.background) {
                    cellStyle.backgroundColor = cellFormat.background;
                    cellClassNames.push('cancel-padding');
                }
                if(cellFormat.foreground) {
                    cellStyle.color = cellFormat.foreground;
                }
                if(cellFormat.font) {
                    const font = getFont(cellFormat.font);
                    cellStyle = {
                        ...cellStyle,
                        fontFamily: font ? font.fontFamily : undefined,
                        fontWeight: font ? font.fontWeight : undefined,
                        fontStyle: font ? font.fontStyle : undefined,
                        fontSize: font ? font.fontSize : undefined
                    }
                }
                if(cellFormat.image) {
                    cellIcon = parseIconData(cellFormat.foreground, cellFormat.image);
                }
            }
        }

        return { cellStyle: cellStyle, cellClassNames: cellClassNames, cellIcon: cellIcon }
    }, [props.cellFormatting, props.colName])

    // Returns the cell-icon or null
    const icon = useMemo(() => {
        if (cellStyles.cellIcon?.icon) {
            if(isFAIcon(cellStyles.cellIcon.icon))
                return <i className={cellStyles.cellIcon.icon} style={{ fontSize: cellStyles.cellIcon.size?.height, color: cellStyles.cellIcon.color}}/>
            else {
                return <img
                    id={props.name}
                    alt="icon"
                    src={context.server.RESOURCE_URL + cellStyles.cellIcon.icon}
                    style={{width: `${cellStyles.cellIcon.size?.width}px`, height: `${cellStyles.cellIcon.size?.height}px` }}
                />
            }    
        } else {
            return null
        }
    }, [cellStyles.cellIcon?.icon, context.server.RESOURCE_URL]);

    const [Renderer, rendererProps] = useMemo(() => {
        switch (columnMetaData?.cellEditor.className) {
            case CELLEDITOR_CLASSNAMES.CHECKBOX:
            case CELLEDITOR_CLASSNAMES.CHOICE:
                return [ DirectCellRenderer, {filter: { columnNames: props.primaryKeys, values: props.primaryKeys.map(pk => props.rowData[pk]) }} ]
            case CELLEDITOR_CLASSNAMES.DATE:
                return [DateCellRenderer, {
                    stateCallback: () => {
                        if (props.setEdit) {
                            //setWaiting(true);
                            props.setEdit(true)
                        }
                    }
                }]
            case CELLEDITOR_CLASSNAMES.IMAGE:
                return [ ImageCellRenderer ]
            case CELLEDITOR_CLASSNAMES.LINKED:
                return [ LinkedCellRenderer, {
                    stateCallback: () => {
                        if (props.setEdit) {
                            //setWaiting(true);
                            props.setEdit(true)
                        }
                    }, 
                    decreaseCallback: props.decreaseCallback }]
            case CELLEDITOR_CLASSNAMES.NUMBER:
                return [ NumberCellRenderer ]
            case CELLEDITOR_CLASSNAMES.TEXT:
                return [ TextCellRenderer ]
            default:
                return [(props:any) => <span className="cell-data-content">{props.cellData}</span>]
        }
    }, [columnMetaData?.cellEditor.className]);

    const handleClickEvent = useCallback(() => {
        console.log('CLICK EVENT')
        if ([CELLEDITOR_CLASSNAMES.IMAGE, CELLEDITOR_CLASSNAMES.CHECKBOX, CELLEDITOR_CLASSNAMES.CHOICE].indexOf(columnMetaData?.cellEditor.className as CELLEDITOR_CLASSNAMES) === -1 &&
            props.setStoredClickEvent && props.setEdit) {
            props.setStoredClickEvent(() => {
                props.setEdit!(true);
            })
        }
    }, [])

    return (
        <div
            style={cellStyles.cellStyle}
            className={cellStyles.cellClassNames.join(' ')}
            onMouseUp={(e) => {
                if (cellContext.selectedCellId === props.cellId) {
                    if ((columnMetaData?.cellEditor.preferredEditorMode === 1 && e.detail === 1) || (columnMetaData?.cellEditor.preferredEditorMode !== 1 && e.detail === 2)) {
                        handleClickEvent();
                    }
                }
            }}>
            <Renderer columnMetaData={columnMetaData!} icon={icon} {...props} {...rendererProps} />
        </div>
    )
}
export default CellRenderer