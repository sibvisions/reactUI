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
import { appContext } from "../../contexts/AppProvider";
import useMetaData from "../../hooks/data-hooks/useMetaData";
import useEventHandler from "../../hooks/event-hooks/useEventHandler";
import useOutsideClick from "../../hooks/event-hooks/useOutsideClick";
import { ColumnDescription, LengthBasedColumnDescription, NumericColumnDescription } from "../../response/data/MetaDataResponse";
import IconProps from "../comp-props/IconProps";
import CellEditorWrapper from "../editors/CellEditorWrapper";
import CELLEDITOR_CLASSNAMES from "../editors/CELLEDITOR_CLASSNAMES";
import DateCellRenderer from "./CellRenderer/DateCellRenderer";
import DirectCellRenderer from "./CellRenderer/DirectCellRenderer";
import ImageCellRenderer from "./CellRenderer/ImageCellRenderer";
import LinkedCellRenderer from "./CellRenderer/LinkedCellRenderer";
import NumberCellRenderer from "./CellRenderer/NumberCellRenderer";
import TextCellRenderer from "./CellRenderer/TextCellRenderer";
import { SelectedCellContext, TableProps } from "./UITable";
import { isFAIcon } from "../../hooks/event-hooks/useButtonMouseImages";
import { SelectFilter } from "../../request/data/SelectRowRequest";
import CellRenderer, { ICellRenderer } from "./CellRenderer/CellRenderer";

// Interface for in-table-editors
export interface IInTableEditor {
    stopCellEditing?: Function
    passedKey?: string,
    isCellEditor: boolean,
    editorStyle?: CSSProperties,
}

// Interface for cell-style-formatting
export interface CellFormatting {
    foreground?: string;
    background?: string;
    font?: string;
    image?: string;
}

// Interface for cell-renderer
export interface ICellRender extends ICellRenderer {
    columnMetaData: ColumnDescription,
    icon: JSX.Element|null,
    filter?: SelectFilter
    stateCallback?: Function,
    decreaseCallback?: Function
}

/** Type for CellEditor */
export interface ICellEditor {
    primaryKeys: string[],
    screenName: string,
    name: string,
    cellData: any,
    dataProvider: string,
    colName: string,
    resource: string,
    cellId: string,
    tableContainer?: any,
    selectNext: Function,
    selectPrevious: Function,
    className?: string,
    cellFormatting?: Map<string, CellFormatting>,
    cellReadOnly?: Map<string, number>,
    startEditing?:boolean,
    insertEnabled?: boolean,
    deleteEnabled?: boolean,
    rowNumber: number
    colIndex: number
    rowData: any,
    setIsEditing: Function,
    removeTableLinkRef?: Function,
    tableIsSelecting: boolean,
    isEditable: boolean,
    addReadOnlyClass: boolean
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
        const docStyle = window.getComputedStyle(document.documentElement);
        const calcWidth = "calc(100% + " + docStyle.getPropertyValue('--table-cell-padding-left-right') + " + 0.1rem)";
        const calcHeight = "calc(100% + " + docStyle.getPropertyValue('--table-cell-padding-top-bottom') + ")";

        editor = <CellEditorWrapper
            {...{
                ...metaData,
                name: props.name,
                dataRow: props.dataProvider,
                columnName: props.colName,
                id: "",
                cellEditor_editable_: true,
                editorStyle: { 
                    width: calcWidth, 
                    height: calcHeight, 
                    //marginLeft: calcMarginLeft, 
                    //marginTop: calcMarginTop 
                },
                autoFocus: true,
                stopCellEditing: stopCellEditing,
                passedKey: passedValues,
                isCellEditor: true,
                rowNumber: props.rowNumber,
                isReadOnly: props.isReadOnly
            }} />
    }
    return editor
}

/**
 * This component displays either just the value of the cell or an in-cell editor
 * @param props - props received by Table
 */
export const CellEditor: FC<ICellEditor> = (props) => {
    const { selectNext, selectPrevious, tableContainer } = props;
    
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

    const docStyle = window.getComputedStyle(document.documentElement);

    // Calculates the minus margin-left to display no gap when opening the cell-editor
    const calcMarginLeft = useMemo(() => "calc(0rem - calc(" + docStyle.getPropertyValue('--table-cell-padding-left-right') + " / 2) - 0.05rem)", []);

    // Calculates the minus margin-top to display no gap when opening the cell-editor
    const calcMarginTop = useMemo(() => "calc(0rem - calc(" + docStyle.getPropertyValue('--table-cell-padding-top-bottom') + " / 2) - 0.1rem)", []);
 
    const [storedClickEvent, setStoredClickEvent] = useState<Function|undefined>(undefined);

    const filter = useMemo(() => {
        const values = props.primaryKeys.map(pk => props.rowData[pk]);
        return {
            columnNames: props.primaryKeys,
            values: values
        }
    }, [props.rowData, props.primaryKeys])

    useEffect(() => {
        if (!edit) {
            passRef.current = "";
        }
    }, [edit]);

    const stopEditing = useCallback(() => {
        const table = context.contentStore.getComponentByName(props.name);
        if (table) {
            (table as TableProps).startEditing = false;
            context.subscriptions.propertiesSubscriber.get(table.id)?.apply(undefined, [table]);
        }
    }, [props.name])

    /** Whenn the selected cell changes and the editor is editable close it */
    useEffect(() => {
        if (edit && cellContext.selectedCellId !== props.cellId) {
            setEdit(false);
            stopEditing()
        }
    }, [cellContext.selectedCellId]);

    // If the selected-cell id is this cell-editors id and startEditing is true, set the edit-state to true
    useEffect(() => {
        if (cellContext.selectedCellId === props.cellId && props.startEditing) {
            setEdit(true);
        }
    },[props.startEditing]);

    /**
     * Callback for stopping the cell editing process, closes editor and based on keyboard input, selects the next or previous cell/row
     * @param event - the KeyboardEvent
     */
    const stopCellEditing = useCallback(async (event?:KeyboardEvent) => {
        let focusTable = true;
        setEdit(false);
        stopEditing()
        if (event) {
            if (event.shiftKey) {
                focusTable = selectPrevious(event.key);
            }
            else {
                focusTable = selectNext(event.key);
            }
        }
        else {
            focusTable = selectNext("Enter");
        }
        if (focusTable) {
            tableContainer.focus();
        }
    }, [setEdit, selectNext, selectPrevious]);

    /** Hook which detects if there was a click outside of the element (to close editor) */
    useOutsideClick(wrapperRef, () => { 
        setEdit(false); 
        stopEditing();
    }, columnMetaData);

    /**
     * Keylistener for cells, if F2 key is pressed, open the editor of the selected cell, if a key is pressed which is an input, open the editor and use the input
     */
    const handleCellKeyDown = useCallback((event: KeyboardEvent) => {
        if (cellContext.selectedCellId === props.cellId) {
            switch (event.key) {
                case "F2":
                    setEdit(true);
                    break;
                default:
                    if (event.key.length === 1 && !event.ctrlKey) {
                        passRef.current = event.key;
                        setEdit(true);
                    }
            }
        }
    }, [cellContext.selectedCellId, setEdit]);

    /** Adds Keylistener to the tableContainer */
    useEventHandler(tableContainer, "keydown", handleCellKeyDown);

    // Returns the cell-icon or null
    // const icon = useMemo(() => {
    //     if (props.cellStyle.cellIcon?.icon) {
    //         if(isFAIcon(props.cellStyle.cellIcon.icon))
    //             return <i className={props.cellStyle.cellIcon.icon} style={{ fontSize: props.cellStyle.cellIcon.size?.height, color: props.cellStyle.cellIcon.color}}/>
    //         else {
    //             return <img
    //                 id={props.name}
    //                 alt="icon"
    //                 src={context.server.RESOURCE_URL + props.cellStyle.cellIcon.icon}
    //                 style={{width: `${props.cellStyle.cellIcon.size?.width}px`, height: `${props.cellStyle.cellIcon.size?.height}px` }}
    //             />
    //         }    
    //     } else {
    //         return null
    //     }
    // }, [props.cellStyle.cellIcon?.icon, context.server.RESOURCE_URL]);

    useEffect(() => {
        props.setIsEditing(edit);
    }, [edit])
    
    useEffect(() => {
        if (!props.tableIsSelecting && storedClickEvent) {
            storedClickEvent();
            setStoredClickEvent(undefined);
        }
    }, [props.tableIsSelecting, storedClickEvent]);

    /** Either return the correctly rendered value or a in-cell editor when readonly is true don't display an editor*/
    return (
        (edit && props.isEditable) ?
            <div style={{ width: "100%", height: "100%", marginLeft: calcMarginLeft, marginTop: calcMarginTop }} ref={wrapperRef}>
                {displayEditor(columnMetaData, { ...props, isReadOnly: !props.isEditable }, stopCellEditing, passRef.current)}
            </div> : <CellRenderer
                name={props.name}
                screenName={props.screenName}
                cellData={props.cellData}
                cellId={props.cellId}
                dataProvider={props.dataProvider}
                colName={props.colName}
                colIndex={props.colIndex}
                primaryKeys={props.primaryKeys}
                rowData={props.rowData}
                rowNumber={props.rowNumber}
                cellFormatting={props.cellFormatting}
                isEditable={props.isEditable}
                isHTML={typeof props.cellData === "string" && (props.cellData as string).includes("<html>")}
                setStoredClickEvent={setStoredClickEvent}
                setEdit={setEdit}
                decreaseCallback={(linkDatabook: string) => props.removeTableLinkRef ? props.removeTableLinkRef(linkDatabook) : undefined}
                addReadOnlyClass={props.addReadOnlyClass}
            />
        // (columnMetaData?.cellEditor?.preferredEditorMode === 1) ?
        //     ((edit && 
        //       //!waiting && 
        //       isEditable) ?
        //         <div style={{ width: "100%", height: "100%", marginLeft: calcMarginLeft, marginTop: calcMarginTop }} ref={wrapperRef}>
        //             {displayEditor(columnMetaData, {...props, isReadOnly: !isEditable}, stopCellEditing, passRef.current)}
        //         </div>
        //         :
        //         <CellRenderer 
        //             name={props.name}
        //             screenName={props.screenName}
        //             cellData={props.cellData}
        //             dataProvider={props.dataProvider}
        //             dataProviderReadOnly={props.dataProviderReadOnly}
        //             colName={props.colName}
        //             colIndex={props.colIndex}
        //             primaryKeys={props.primaryKeys}
        //             rowData={props.rowData}
        //             rowNumber={props.rowNumber}
        //             cellFormatting={props.cellFormatting}
        //             isHTML={typeof props.cellData === "string" && (props.cellData as string).includes("<html>")}
        //             setStoredClickEvent={setStoredClickEvent}
        //             setEdit={setEdit}
        //             decreaseCallback={(linkDatabook:string) => props.removeTableLinkRef ? props.removeTableLinkRef(linkDatabook) : undefined}
        //              />
        //         // <div
        //         //     style={props.cellStyle.cellStyle}
        //         //     className={props.cellStyle.cellClassNames.join(' ') + " " + isEditable}
        //         //     onClick={() => {
        //         //         if ([CELLEDITOR_CLASSNAMES.IMAGE, CELLEDITOR_CLASSNAMES.CHECKBOX, CELLEDITOR_CLASSNAMES.CHOICE].indexOf(columnMetaData?.cellEditor.className as CELLEDITOR_CLASSNAMES) === -1) {
        //         //             setStoredClickEvent(() => {
        //         //                 //setWaiting(true);
        //         //                 setEdit(true);
        //         //             });
        //         //         }
        //         //     }}>
        //         //     <Component icon={icon} columnMetaData={columnMetaData!} {...props} {...extraProps} />
        //         // </div>
        //     ) : (edit && isEditable ?
        //         <div style={{ width: "100%", height: "100%", marginLeft: calcMarginLeft, marginTop: calcMarginTop }} ref={wrapperRef}>
        //             {displayEditor(columnMetaData, { ...props, isReadOnly: !isEditable }, stopCellEditing, passRef.current)}
        //         </div>
        //         :
        //         <CellRenderer />
        //         // <div
        //         //     style={props.cellStyle.cellStyle}
        //         //     className={props.cellStyle.cellClassNames.join(' ')}
        //         //     onDoubleClick={() => setStoredClickEvent(() => handleDoubleClick())}>
        //         //     <Component icon={icon} columnMetaData={columnMetaData!} {...props} {...extraProps} />
        //         // </div>
        //     )
    )
}
