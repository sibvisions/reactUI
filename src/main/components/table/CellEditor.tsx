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

import React, { CSSProperties, FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import _ from "underscore";
import { 
    useOutsideClick, 
    useEventHandler,
    useMetaData,
} from "../../hooks";
import { appContext } from "../../AppProvider";
import { getFont, IconProps, parseIconData } from "../comp-props";
import { CellEditorWrapper, CELLEDITOR_CLASSNAMES } from "../editors";
import { checkComponentName } from "../../util";
import { ColumnDescription, LengthBasedColumnDescription, NumericColumnDescription } from "../../response";
import { 
    DateCellRenderer, 
    DirectCellRenderer, 
    ImageCellRenderer, 
    LinkedCellRenderer, 
    NumberCellRenderer, 
    TextCellRenderer,
    SelectedCellContext
} from "./";


export interface IInTableEditor {
    stopCellEditing?: Function
    passedKey?: string,
    isCellEditor: boolean,
    cellScreenName: string,
    editorStyle?: CSSProperties
}

export interface CellFormatting {
    foreground?: string;
    background?: string;
    font?: string;
    image?: string;
}

export interface ICellRender extends ICellEditor {
    columnMetaData: ColumnDescription,
    icon: JSX.Element|null,
    stateCallback?: Function
}

/** Type for CellEditor */
export interface ICellEditor {
    pk: any,
    screenName: string,
    name: string,
    cellData: any,
    dataProvider: string,
    colName: string,
    resource: string,
    cellId: Function,
    tableContainer?: any,
    selectNext: Function,
    selectPrevious: Function,
    enterNavigationMode: number,
    tabNavigationMode: number,
    selectedRow: any,
    className?: string,
    colReadonly?: boolean,
    tableEnabled?: boolean
    cellFormatting?: CellFormatting[],
    startEditing?:boolean,
    stopEditing:Function,
    editable?: boolean,
    insertEnabled?: boolean,
    updateEnabled?: boolean,
    deleteEnabled?: boolean,
    dataProviderReadOnly?: boolean
    rowNumber: number
    colIndex: number
    filter?: Function
}

/** 
 * Returns an in-cell editor for the column 
 * @param metaData - the metaData of the CellEditor
 * @param props - properties of the cell
 * @returns in-cell editor for the column
 */
function displayEditor(metaData: LengthBasedColumnDescription | NumericColumnDescription | undefined, props: any, stopCellEditing: Function, passedValues: string) {
    let editor = <div>{props.cellData}</div>
    if (metaData) {
        editor = <CellEditorWrapper
            {...{
                ...metaData,
                name: props.name,
                dataRow: props.dataProvider,
                columnName: props.colName,
                id: "",
                cellEditor_editable_: true,
                editorStyle: { width: "100%", height: "100%" },
                autoFocus: true,
                stopCellEditing: stopCellEditing,
                passedKey: passedValues,
                isCellEditor: true,
                cellScreenName: props.dataProvider.split("/")[1],
                rowNumber: props.rowNumber
            }} />
    }
    return editor
}

/**
 * This component displays either just the value of the cell or an in-cell editor
 * @param props - props received by Table
 */
export const CellEditor: FC<ICellEditor> = (props) => {
    const { selectNext, selectPrevious, enterNavigationMode, tabNavigationMode, tableContainer } = props;
    
    /** State if editing is currently possible */
    const [edit, setEdit] = useState(false);

    /** Reference for element wrapping the cell value/editor */
    const wrapperRef = useRef(null);

    /** Reference which contains the pressed key for input editors */
    const passRef = useRef<string>("")

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Context for the selected cell */
    const cellContext = useContext(SelectedCellContext);

    /** Metadata of the columns */
    const columnMetaData = useMetaData(props.screenName, props.dataProvider, props.colName);

    /** State if the CellEditor is currently waiting for the selectedRow */
    const [waiting, setWaiting] = useState<boolean>(false);

    /** When a new selectedRow is set, set waiting to false and if edit is false reset the passRef */
    useEffect(() => {
        if (props.selectedRow) {
            if (!edit) {
                passRef.current = "";
            }
            const pickedVals = _.pick(props.selectedRow.data, Object.keys(props.pk));
            if (waiting && _.isEqual(pickedVals, props.pk)) {
                setWaiting(false);
            }
        }
    }, [props.selectedRow, edit]);

    /** Whenn the selected cell changes and the editor is editable close it */
    useEffect(() => {
        if (cellContext.selectedCellId !== props.cellId().selectedCellId) {
            if (edit) {
                setEdit(false);
                props.stopEditing()
            }
        }
    }, [cellContext.selectedCellId]);

    useEffect(() => {
        if (cellContext.selectedCellId === props.cellId().selectedCellId && props.startEditing) {
            setEdit(true);
        }
    },[props.startEditing]);

    /**
     * Callback for stopping the cell editing process, closes editor and based on keyboard input, selects the next or previous cell/row
     * @param event - the KeyboardEvent
     */
    const stopCellEditing = useCallback((event?:KeyboardEvent) => {
        setEdit(false);
        props.stopEditing()
        if (event) {
            if (event.key === "Enter") {
                if (event.shiftKey) {
                    selectPrevious(enterNavigationMode);
                }
                else {
                    selectNext(enterNavigationMode);
                }
            }
            else if (event.key === "Tab") {
                event.preventDefault();
                if (event.shiftKey) {
                    selectPrevious(tabNavigationMode);
                }
                else {
                    selectNext(tabNavigationMode);
                }
            }
        }
        else {
            selectNext(enterNavigationMode);
        }
        tableContainer.focus()
    }, [setEdit, selectNext, selectPrevious, enterNavigationMode, tabNavigationMode]);

    /** Hook which detects if there was a click outside of the element (to close editor) */
    useOutsideClick(wrapperRef, () => { setEdit(false); props.stopEditing() }, columnMetaData);

    /**
     * Keylistener for cells, if F2 key is pressed, open the editor of the selected cell, if a key is pressed which is an input, open the editor and use the input
     */
    const handleCellKeyDown = useCallback((event: KeyboardEvent) => {
        if (cellContext.selectedCellId === props.cellId().selectedCellId) {
            switch (event.key) {
                case "F2":
                    setEdit(true);
                    break;
                default:
                    if (event.key.length === 1) {
                        passRef.current = event.key;
                        setEdit(true);
                    }
            }
        }
    }, [cellContext.selectedCellId, setEdit]);

    /** Adds Keylistener to the tableContainer */
    useEventHandler(tableContainer, "keydown", (e:any) => handleCellKeyDown(e));

    const isEditable = useMemo(() => {
        if (!props.colReadonly
            && !props.dataProviderReadOnly 
            && props.updateEnabled 
            && props.tableEnabled !== false 
            && props.editable !== false) {
            return true;
        }
        return false;
        
    }, [props.dataProviderReadOnly, props.updateEnabled, props.colReadonly, props.tableEnabled, props.editable, props.cellData]);

    let cellStyle:any = { };
    const cellClassNames:string[] = ['cell-data', typeof props.cellData === "string" && (props.cellData as string).includes("<html>") ? "html-cell" : ""];
    let cellIcon: IconProps | null = null;

    if (props.cellFormatting && props.cellFormatting[props.colIndex]) {
        if(props.cellFormatting[props.colIndex].background) {
            cellStyle.backgroundColor = props.cellFormatting[props.colIndex].background;
            cellClassNames.push('cancel-padding');
        }
        if(props.cellFormatting[props.colIndex].foreground) {
            cellStyle.color = props.cellFormatting[props.colIndex].foreground;
        }
        if(props.cellFormatting[props.colIndex].font) {
            const font = getFont(props.cellFormatting[props.colIndex].font);
            cellStyle = {
                ...cellStyle,
                fontFamily: font ? font.fontFamily : undefined,
                fontWeight: font ? font.fontWeight : undefined,
                fontStyle: font ? font.fontStyle : undefined,
                fontSize: font ? font.fontSize : undefined
            }
        }
        if(props.cellFormatting[props.colIndex].image) {
            cellIcon = parseIconData(props.cellFormatting[props.colIndex].foreground, props.cellFormatting[props.colIndex].image);
        }
    }

    const icon = useMemo(() => {
        if (cellIcon?.icon) {
            if(cellIcon.icon.includes('fas fa-') || cellIcon.icon.includes('far fa-') || cellIcon.icon.includes('fab fa-'))
                return <i className={cellIcon.icon} style={{ fontSize: cellIcon.size?.height, color: cellIcon.color}}/>
            else {
                return <img
                    id={checkComponentName(props.name)}
                    alt="icon"
                    src={context.server.RESOURCE_URL + cellIcon.icon}
                    style={{width: `${cellIcon.size?.width}px`, height: `${cellIcon.size?.height}px` }}
                />
            }    
        } else {
            return null
        }
    }, [cellIcon?.icon, context.server.RESOURCE_URL]);

    const getRenderer = () => {
        switch (columnMetaData?.cellEditor.className) {
            case CELLEDITOR_CLASSNAMES.CHECKBOX:
            case CELLEDITOR_CLASSNAMES.CHOICE:
                return <DirectCellRenderer icon={icon} columnMetaData={columnMetaData} {...props} />
            case CELLEDITOR_CLASSNAMES.DATE:
                return <DateCellRenderer icon={icon} stateCallback={() => { setWaiting(true); setEdit(true) }} columnMetaData={columnMetaData} {...props} />
            case CELLEDITOR_CLASSNAMES.IMAGE:
                return <ImageCellRenderer icon={icon} columnMetaData={columnMetaData} {...props} />
            case CELLEDITOR_CLASSNAMES.LINKED:
                return <LinkedCellRenderer icon={icon} stateCallback={() => { setWaiting(true); setEdit(true) }} columnMetaData={columnMetaData} {...props} />
            case CELLEDITOR_CLASSNAMES.NUMBER:
                return <NumberCellRenderer icon={icon} columnMetaData={columnMetaData} {...props} />
            case CELLEDITOR_CLASSNAMES.TEXT:
                return <TextCellRenderer icon={icon} columnMetaData={columnMetaData} {...props} />
            default:
                return props.cellData
        }
    }

    /** Either return the correctly rendered value or a in-cell editor when readonly is true don't display an editor*/
    return (
        (isEditable) ?
            (columnMetaData?.cellEditor?.preferredEditorMode === 1) ?
                ((edit && !waiting) ?
                    <div style={{ width: "100%", height: "100%" }} ref={wrapperRef}>
                        {displayEditor(columnMetaData, props, stopCellEditing, passRef.current)}
                    </div>
                    :
                    <div
                        style={cellStyle}
                        className={cellClassNames.join(' ') + " " + isEditable}
                        onClick={() => {
                            if ([CELLEDITOR_CLASSNAMES.IMAGE, CELLEDITOR_CLASSNAMES.CHECKBOX, CELLEDITOR_CLASSNAMES.CHOICE].indexOf(columnMetaData?.cellEditor.className as CELLEDITOR_CLASSNAMES) === -1) {
                                setWaiting(true);
                                setEdit(true);
                            }
                        }}>
                        {getRenderer()}
                    </div>
                ) : (!edit ?
                    <div
                        style={cellStyle}
                        className={cellClassNames.join(' ')}
                        onDoubleClick={() => {
                            if ([CELLEDITOR_CLASSNAMES.IMAGE, CELLEDITOR_CLASSNAMES.CHECKBOX, CELLEDITOR_CLASSNAMES.CHOICE].indexOf(columnMetaData?.cellEditor.className as CELLEDITOR_CLASSNAMES) === -1) {
                                setWaiting(true);
                                setEdit(true)
                            }
                        }}>
                        {getRenderer()}
                    </div>
                    :
                    <div style={{ width: "100%", height: "100%" }} ref={wrapperRef}>
                        {displayEditor(columnMetaData, props, stopCellEditing, passRef.current)}
                    </div>)
            : <div
                style={cellStyle}
                className={cellClassNames.join(' ')}>
                {getRenderer()}
            </div>
    )
}
