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

import React, { CSSProperties, FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AutoComplete } from 'primereact/autocomplete';
import tinycolor from "tinycolor2";
import { createFetchRequest, createFilterRequest, createSelectRowRequest } from "../../../factories/RequestFactory";
import { showTopBar } from "../../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../../../util/server-util/SendFocusRequests";
import { IRCCellEditor } from "../CellEditorWrapper";
import Server from "../../../server/Server";
import BaseContentStore from "../../../contentstore/BaseContentStore";
import ServerFull from "../../../server/ServerFull";
import { isFAIcon } from "../../../hooks/event-hooks/useButtonMouseImages";
import { ICellEditor } from "../IEditor";
import REQUEST_KEYWORDS from "../../../request/REQUEST_KEYWORDS";
import useDataProviderData from "../../../hooks/data-hooks/useDataProviderData";
import { getTextAlignment } from "../../comp-props/GetAlignments";
import MetaDataResponse from "../../../response/data/MetaDataResponse";
import useMetaData from "../../../hooks/data-hooks/useMetaData";
import useMouseListener from "../../../hooks/event-hooks/useMouseListener";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import useEventHandler from "../../../hooks/event-hooks/useEventHandler";
import { handleEnterKey } from "../../../util/other-util/HandleEnterKey";
import { sendSetValues } from "../../../util/server-util/SendSetValues";
import { getFont, parseIconData } from "../../comp-props/ComponentProperties";
import usePopupMenu from "../../../hooks/data-hooks/usePopupMenu";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { getTabIndex } from "../../../util/component-util/GetTabIndex";
import { IExtendableLinkedEditor } from "../../../extend-components/editors/ExtendLinkedEditor";
import _ from "underscore";
import useRequestFocus from "../../../hooks/event-hooks/useRequestFocus";
import useDesignerUpdates from "../../../hooks/style-hooks/useDesignerUpdates";
import useHandleDesignerUpdate from "../../../hooks/style-hooks/useHandleDesignerUpdate";
import { SelectFilter } from "../../../request/data/SelectRowRequest";

// Type for linkreferences
type LinkReference = {
    referencedDataBook: string
    columnNames: string[]
    referencedColumnNames: string[],
    dataToDisplayMap?: Map<string, string>
}

/** Interface for cellEditor property of LinkedCellEditor */
export interface ICellEditorLinked extends ICellEditor {
    linkReference: LinkReference
    columnView: {
        columnCount: number
        columnNames: Array<string>
        rowDefinitions: Array<any>

    }
    clearColumns:Array<string>
    displayReferencedColumnName?:string
    tableHeaderVisible?:boolean
    displayConcatMask?: string,
    validationEnabled?: boolean
}

/** Interface for LinkedCellEditor */
export interface IEditorLinked extends IRCCellEditor {
    cellEditor: ICellEditorLinked
}

/**
 * Sends a fetch-request to the server to fetch a LinkedCellEditors referenced databook
 * @param screenName - the name of the screen
 * @param databook - the databook to fetch
 * @param selectedRecord - the currently selected record (only send request if there is a value to display)
 * @param displayCol - the column which should be displayed
 * @param server - the server instance
 * @param contentStore - the contentStore instance
 */
export function fetchLinkedRefDatabook(screenName: string, databook: string, selectedRecord: any, displayCol: string | null | undefined, concatMask: string | undefined, server: Server | ServerFull, contentStore: BaseContentStore, name?: string, decreaseCallback?: Function) {
    const refDataBookInfo = contentStore.getDataBook(screenName, databook);
    if (selectedRecord
        && (displayCol || concatMask)
        && (!refDataBookInfo?.data)
        && !server.missingDataFetches.includes(databook)) {
        server.missingDataFetches.push(databook);
        const filterReq = createFilterRequest();
        filterReq.dataProvider = databook;
        filterReq.editorComponentId = name;
        filterReq.value = "";
        if (!refDataBookInfo?.metaData) {
            filterReq.includeMetaData = true;
        }
        server.sendRequest(filterReq, REQUEST_KEYWORDS.FILTER).then(() => decreaseCallback ? decreaseCallback(databook) : undefined)
    }
}

/**
 * Returns an object with the extracted key, value pairs that were provided
 * @param value - the object to be extracted
 * @param keys - the keys you want to extract
 */
export function getExtractedObject(value:any|undefined, keys:string[]):any {
    return _.pick(value, keys) as any;
}

/**
 * Returns an object with linkReference columnNames keys converted to an object with linkReference referencedColumnNames 
 * @param value - the object to be converted
 * @param linkReference - the linkReference of the editor
 */
export function convertColNamesToReferenceColNames(value:any, linkReference: LinkReference, colName: string) {
    if (value) {
        const columnNames = linkReference.columnNames.length ? linkReference.columnNames : [colName]
        const extractedObject = getExtractedObject(value, columnNames);
        if (extractedObject 
            && columnNames.length
            && linkReference.referencedColumnNames.length) {
            const newVal:any = {}
            columnNames.forEach((colNames, i) => {
                if (extractedObject[colNames] !== undefined) {
                    newVal[linkReference.referencedColumnNames[i]] = extractedObject[colNames];
                }
            });
            return newVal
        }
        return extractedObject
    }
    else {
        return value;
    }
}

/**
 * Returns an object with linkReference referencedColumnNames keys converted to an object with linkReference columnNames 
 * @param value - the object to be converted
 * @param linkReference - the linkReference of the editor
 */
export function convertReferenceColNamesToColNames(value:any, linkReference: LinkReference) {
    if (value) {
        const extractedObject = getExtractedObject(value, linkReference.referencedColumnNames);
        if (extractedObject 
            && linkReference.columnNames.length 
            && linkReference.referencedColumnNames.length) {
            const newVal:any = {}
            linkReference.referencedColumnNames.forEach((colNames, i) => {
                if (extractedObject[colNames] !== undefined) {
                    newVal[linkReference.columnNames[i]] = extractedObject[colNames];
                }
            });
            return newVal
        }
        return extractedObject
    }
    else {
        return value;
    }
}

/**
 * This component displays an input field with a button which provides a dropdownlist with values of a databook
 * when text is entered into the inputfield, the dropdownlist gets filtered
 * @param props - Initial properties sent by the server for this component
 */
const UIEditorLinked: FC<IEditorLinked & IExtendableLinkedEditor> = (props) => {
    /** Reference for the LinkedCellEditor element */
    const linkedRef = useRef<any>(null);

    /** Reference for the wrapper of the linkedcelleditor element */
    const wrapperRef = useRef<HTMLSpanElement>(null);

    /** Reference for the LinkedCellEditor input element */
    const linkedInput = useRef<any>(null);

    /** The data provided by the databook */
    const [providedData] = useDataProviderData(props.screenName, props.cellEditor.linkReference.referencedDataBook||"");

    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();

    /** Metadata for the linkreferenced databook */
    const metaDataReferenced:MetaDataResponse = useMetaData(props.screenName, props.cellEditor.linkReference.referencedDataBook||"") as MetaDataResponse;

    /** Metadata for the 'normal' bound databook */
    const metaData:MetaDataResponse = useMetaData(props.screenName, props.dataRow||"") as MetaDataResponse;

    /** The metadata of the celleditor */
    const cellEditorMetaData = useMemo(() => {
        if (metaData && metaData.columns.find(column => column.name === props.columnName)) {
            return metaData.columns.find(column => column.name === props.columnName)?.cellEditor as ICellEditorLinked
        }
        return undefined
    }, [props.columnName, metaData]);

    /** True, if there is a displayReferencedColumnName or a displayConcatMask */
    const isDisplayRefColNameOrConcat = useMemo(() => props.cellEditor.displayReferencedColumnName || props.cellEditor.displayConcatMask, [props.cellEditor.displayReferencedColumnName, props.cellEditor.displayConcatMask])

    /** True if the linkRef has already been fetched */
    const linkRefFetchFlag = useMemo(() => providedData.length > 0, [providedData]);

    // Return the linkReference of the celleditormetadata if there is one else use the linkReference of the celleditor properties
    const getCorrectLinkReference = useCallback(() => {
        if (cellEditorMetaData && cellEditorMetaData.linkReference) {
            return cellEditorMetaData.linkReference
        }
        return props.cellEditor.linkReference;
    }, [cellEditorMetaData, props.cellEditor.linkReference])

    /**
     * Returns the value which should be displayed in the linkedcelleditor input.
     * Usually take the bound column but when there is a displayReferencedColumnname or a concat-mask,
     * check the dataToDisplayMap in the linkReference and pick the correct value by stringifying the selected object.
     */
    const getDisplayValue = useCallback((value:any) => {
        if (value) {
            if (isDisplayRefColNameOrConcat) {     
                const linkReference = getCorrectLinkReference();
                const index = linkReference.columnNames.findIndex(colName => colName === props.columnName);
                const extractedObject = getExtractedObject(value, [linkReference.referencedColumnNames[index]]);
                if (linkReference.dataToDisplayMap?.has(JSON.stringify(extractedObject))) {
                    return linkReference.dataToDisplayMap!.get(JSON.stringify(extractedObject))
                }
            }
    
            if (props.selectedRow && props.selectedRow.data[props.columnName]) {
                return props.selectedRow.data[props.columnName]
            }
            return value[props.columnName]
        }
        return ""
    },[isDisplayRefColNameOrConcat, linkRefFetchFlag, props.cellEditor, cellEditorMetaData, props.selectedRow, props.columnName])

    /** Current state of text value of input element */
    const [text, setText] = useState(getDisplayValue(props.selectedRow ? convertColNamesToReferenceColNames(props.selectedRow.data, getCorrectLinkReference(), props.columnName)  : undefined));

    /** Extracting onLoadCallback and id from props */
    const {onLoadCallback, id} = props;

    /** The horizontal- and vertical alignments */
    const textAlignment = useMemo(() => getTextAlignment(props), [props]);

    /** True, if the CellEditor is currently focused */
    const focused = useRef<boolean>(false);

    /** True if the initialFilter has been set */
    const [initialFilter, setInitialFilter] = useState<boolean>(false);

    /** Subscribes to designer-changes so the components are updated live */
    const designerUpdate = useDesignerUpdates("linked-date");

    /** Button background */
    const btnBgd = useMemo(() => window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color'), [designerUpdate]);

    /** True, if the dropdown should be displayed as table */
    const tableOptions = useMemo(() => props.cellEditor.columnView ? props.cellEditor.columnView.columnCount > 1 : metaDataReferenced ? metaDataReferenced.columnView_table_.length > 1 : false, [props.cellEditor.columnView, metaDataReferenced]); 

    /** If the columnView of the celleditor is empty use "columnView_table of the referenced databook instead" */
    const columnViewNames = useMemo(() => props.cellEditor.columnView ? props.cellEditor.columnView.columnNames : metaDataReferenced ? metaDataReferenced.columnView_table_ : [], [props.cellEditor.columnView, metaDataReferenced]);

    // Helper to set the text on unmount
    const textCopy = useRef<any>(text);

    // Use the primaryKeyColumns from the referenced metadata or use the referencedColumnNames if empty.
    const primaryKeys:string[] = useMemo(() => {
        const linkReference = getCorrectLinkReference();
        if (metaDataReferenced) {
            if (metaDataReferenced.primaryKeyColumns) {
                return metaDataReferenced.primaryKeyColumns;
            }
        }
        return linkReference.referencedColumnNames;
    }, [metaDataReferenced, getCorrectLinkReference]);

    /** Hook for MouseListener */
    useMouseListener(props.name, linkedRef.current ? linkedRef.current.container : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** Handles the requestFocus property */
    useRequestFocus(id, props.requestFocus, linkedInput.current, props.context);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && wrapperRef.current) {
            sendOnLoadCallback(id, props.cellEditor.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), wrapperRef.current, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    /** Retriggers the size-measuring and sets the layoutstyle to the component */
    useHandleDesignerUpdate(
        designerUpdate,
        wrapperRef.current,
        props.layoutStyle,
        (clone: HTMLElement) => sendOnLoadCallback(
            id,
            props.cellEditor.className,
            parsePrefSize(props.preferredSize),
            parseMaxSize(props.maximumSize),
            parseMinSize(props.minimumSize),
            clone,
            onLoadCallback
        ),
        onLoadCallback
    );

    /** disable dropdownbutton tabIndex */
    useEffect(() => {
        const autoRef: any = linkedRef.current
        if (autoRef) {
            autoRef.dropdownButton.tabIndex = -1;
        }

        if (props.isCellEditor && props.passedKey) {
            setText("");
        }

        // on unmount save the value, use textcopy because text would be empty
        return () => {
            if (props.context.contentStore.activeScreens.map(screen => screen.name).indexOf(props.screenName) !== -1 && linkedInput.current && props.isCellEditor) {
                handleInput(textCopy.current)
            }
        }
    }, []);

    // Disable the dropdown-button if the editor is set to readonly
    useEffect(() => {
        const autoRef: any = linkedRef.current
        if (autoRef) {
            if (props.isReadOnly) {
                if (!autoRef.dropdownButton.disabled) {
                    autoRef.dropdownButton.disabled = true;
                }
                
            }
            else if (autoRef.dropdownButton.disabled) {
                autoRef.dropdownButton.disabled = false;
            }
        }
    }, [props.isReadOnly])

    // Sets the textCopy to the text so textCopy isn't empty on celleditor unmount
    useEffect(() => {
        textCopy.current = text
    }, [text])

    /** If there is a selectedRow to display, a display-referenced-column and it hasn't been fetched yet, then fetch the reference-databook */
    useEffect(() => {
        fetchLinkedRefDatabook(
            props.screenName, 
            props.cellEditor.linkReference.referencedDataBook,
            props.selectedRow ? props.selectedRow.data : undefined, 
            props.cellEditor.displayReferencedColumnName,
            props.cellEditor.displayConcatMask,
            props.context.server, 
            props.context.contentStore, props.name);
    }, [props.selectedRow])

    /** When props.selectedRow changes set the state of inputfield value to props.selectedRow and update lastValue reference */
    useEffect(() => {
        if (props.selectedRow) {
            if (isDisplayRefColNameOrConcat) {
                if (cellEditorMetaData) {
                    if (cellEditorMetaData.linkReference) {
                        if (cellEditorMetaData.linkReference.dataToDisplayMap?.size || props.cellEditor.displayReferencedColumnName) {
                            const linkReference = getCorrectLinkReference();
                            const index = linkReference.columnNames.findIndex(colName => colName === props.columnName);
                            const extractedObject = getExtractedObject(convertColNamesToReferenceColNames(props.selectedRow.data, linkReference, props.columnName), [linkReference.referencedColumnNames[index]]);
                            setText(getDisplayValue(extractedObject))
                            lastValue.current = props.selectedRow.data;
                        }
                    }
                    else {
                        const refDB = props.context.contentStore.getDataBook(props.screenName, props.cellEditor.linkReference.referencedDataBook);
                        if (refDB) {
                            if (refDB.referencedCellEditors) {
                                refDB.referencedCellEditors.push({cellEditor: props.cellEditor, columnName: props.columnName, dataBook: props.dataRow});
                            }
                            else {
                                refDB.referencedCellEditors = [{cellEditor: props.cellEditor, columnName: props.columnName, dataBook: props.dataRow}];
                            }
                        }
                    }
                }
            }
            else {
                setText(getDisplayValue(props.selectedRow.data));
                lastValue.current = props.selectedRow.data;
            }
        }
    }, [props.selectedRow, linkRefFetchFlag, cellEditorMetaData]);

    // If the lib user extends the LinkedCellEditor with onChange, call it when slectedRow changes.
    useEffect(() => {
        if (props.onChange) {
            props.onChange(cellEditorMetaData && cellEditorMetaData.linkReference.dataToDisplayMap?.get(props.selectedRow ? props.selectedRow.data : undefined))
        }
    }, [props.selectedRow, linkRefFetchFlag, props.onChange, cellEditorMetaData])

    /**
     * Either returns the unpacked value out of an array based on the columnView which should be shown in the input , or just returns the value if there is no array
     * @param value - the selected value of the linked-cell-editor
     */
    const unpackValue = (value: string | string[]) => {
        // If the value is an array, get the index of the link-cell-editor column in the linkReference.
        // Then use this index with the referencedColumnNames to find the column in the columnView and return the correct value.
        if (Array.isArray(value)) {
            if (isDisplayRefColNameOrConcat) {
                const result:any = {}
                props.cellEditor.linkReference.referencedColumnNames.forEach((key, i) => result[key] = value[i])
                return result;
            }
            else {
                const colNameIndex = props.cellEditor.linkReference.columnNames.findIndex(columnName => columnName === props.columnName);
                return value[colNameIndex];
            }
        } else {
            return value;
        }
    }

    /**
     * When the input changes, send a filter request to the server
     * @param event - Event that gets fired on inputchange
     */
    const sendFilter = useCallback(async (value:any) => {
        const refDataBookInfo = props.context.contentStore.getDataBook(props.screenName, props.cellEditor.linkReference.referencedDataBook);
        props.context.contentStore.clearDataFromProvider(props.screenName, props.cellEditor.linkReference.referencedDataBook||"")
        const filterReq = createFilterRequest();
        filterReq.dataProvider = props.cellEditor.linkReference?.referencedDataBook;
        filterReq.editorComponentId = props.name;
        filterReq.value = value;

        if (props.isCellEditor) {
            filterReq.columnNames = [props.columnName]
        }

        if (!refDataBookInfo?.metaData) {
            filterReq.includeMetaData = true;
        }

        if (props.onFilter) {
            props.onFilter(value);
        }
        
        await props.context.server.sendRequest(filterReq, REQUEST_KEYWORDS.FILTER).then(() => {
            if (!initialFilter) {
                setInitialFilter(true);
            }
        });
    }, [props.context.contentStore, props.context.server, props.cellEditor, props.name, props.cellEditor.linkReference.referencedDataBook]);

    // Build a suggestion-array by firstly adding the referencedColumnNames then the columnViewNames and primaryKeyColumns
    const buildSuggestionArray = (value:any) => {
        const arr:any[] = [];
        props.cellEditor.linkReference.referencedColumnNames.forEach((d) => {
            arr.push(value[d]);
        });

        columnViewNames.forEach((d) => {
            arr.push(value[d]);
        });

        primaryKeys.forEach((d) => {
            arr.push(value[d])
        })

        return arr;
    }

    /**
     * Unpacks the suggestion-array and picks out the correct values based on the type.
     * If reference use index 0 (begin from start)
     * if display begin at the end of linkedreference columns to get the display values
     * if primary use index linkedreference col length + columnView length until the end to get primary keys.
     * @param value - the value of the suggestion-array
     * @param type - the type which needs to be unpacked
     * @returns 
     */
    const unpackSuggestionArray = (value: any[], type:"reference"|"display"|"primary") => {
        if (value) {
            if (type === "display") {
                let displayObj: any = {}
                let j = 0;
                for (let i = props.cellEditor.linkReference.referencedColumnNames.length; i < value.length - primaryKeys.length; i++) {
                    displayObj[columnViewNames[j]] = value[i];
                    j++;
                }
                return displayObj;
            }
            else if (type === "primary") {
                let primaryObj: any = {};
                let j = 0;
                for (let i = props.cellEditor.linkReference.referencedColumnNames.length + columnViewNames.length; i < value.length; i++) {
                    primaryObj[primaryKeys[j]] = value[i];
                    j++;
                }
                return primaryObj
            }
            else {
                let sendObj: any = {}
                for (let i = 0; i < props.cellEditor.linkReference.referencedColumnNames.length; i++) {
                    sendObj[props.cellEditor.linkReference.referencedColumnNames[i]] = value[i];
                }
                return sendObj
            }
        }
        return undefined
    }

    // If autoOpenPopup is true and preferredEditorMode is 1 (singleclick) and it is a table-cell-editor, open the overlay directly and send an empty filter
    useEffect(() => {
        setTimeout(() => {
            if(linkedRef.current && props.cellEditor.autoOpenPopup && (props.cellEditor.preferredEditorMode === 1 && props.isCellEditor)) {
                sendFilter("");
                (linkedRef.current as any).showOverlay();
            }
        }, 33)

    }, [props.cellEditor.autoOpenPopup, props.cellEditor.preferredEditorMode, props.isCellEditor, sendFilter]);

    // Sends an focus-gained event to the server
    useEffect(() => {
        if (focused.current && initialFilter && props.eventFocusGained) {
            //setTimeout 0ms so the transition is playing
            setTimeout(() => onFocusGained(props.name, props.context.server), 0);
        }
    }, [initialFilter])

    /**
     * When enter is pressed "submit" the value
     */
    useEventHandler(linkedInput.current || undefined, "keydown", (event) => {
        if((event as KeyboardEvent).key === "Enter" && !document.querySelector('.p-autocomplete-item.p-highlight')) {
            (linkedRef.current as any).hideOverlay();
            handleEnterKey(event, event.target, props.name, props.stopCellEditing);
        }
        else if (props.isCellEditor && props.stopCellEditing) {
            if ((event as KeyboardEvent).key === "Tab") {
                (event.target as HTMLElement).blur()
                props.stopCellEditing(event);
            }
            else if ((event as KeyboardEvent).key === "Escape") {
                props.stopCellEditing(event)
            }
        }
    });

    /**
     * Builds a select row request and sends it to the server
     * @param rowNumber - the rownumber which is being selected
     * @param filter - the filter to select a row
     */
    const sendSelectRequest = (rowNumber: number, filter: any) => {
        const selectReq = createSelectRowRequest();
        selectReq.dataProvider = props.cellEditor.linkReference.referencedDataBook || cellEditorMetaData?.linkReference.referencedDataBook;
        selectReq.componentId = props.name;
        selectReq.rowNumber = rowNumber;
        if (filter !== undefined) {
            selectReq.filter = filter;
        }
        showTopBar(props.context.server.sendRequest(selectReq, REQUEST_KEYWORDS.SELECT_ROW), props.topbar);
    }

    // Handles the selection event
    const handleSelect = (value: string[]) => {
        const linkReference = props.cellEditor.linkReference;
        const refColNames = linkReference.referencedColumnNames;
        const colNames = linkReference.columnNames;
        const index = colNames.findIndex(col => col === props.columnName);
        const columnNames = (colNames.length === 0 && refColNames.length === 1) ? props.columnName : colNames;
        // value is the suggestion-array, now unpack the suggestion-array by referencedColumns and primarykeys
        let inputObj:any|any[] = unpackSuggestionArray(value, "reference");
        let primaryObj:any|any[] = unpackSuggestionArray(value, "primary");
        
        // Convert inputObj keys from ref to colnames to compare them to the lastvalue
        const convertedColNamesObj = convertReferenceColNamesToColNames(inputObj, props.cellEditor.linkReference);
        const extractedLastValue = getExtractedObject(lastValue.current, colNames);

        // Check if the object is equal to the lastValue if yes don't send anything and set the text to the lastvalue
        if (_.isEqual(convertedColNamesObj, extractedLastValue)) {
            // lastvalue needs to be converted to referenceColumnNames because dataToDisplay Map is built from referenceColumnNames
            setText(getDisplayValue(isDisplayRefColNameOrConcat ? convertColNamesToReferenceColNames(extractedLastValue, props.cellEditor.linkReference, props.columnName) : extractedLastValue));
        }
        else {
            let filter:SelectFilter = {
                columnNames: primaryKeys,
                values: primaryKeys.map(pk => primaryObj[pk])
            };
            // Set text, send selectrequest and setvalues if values are being found
            if (colNames.length > 1) {
                if (colNames.length > Object.values(inputObj).length) {
                    let tempValues = Object.values(inputObj)
                    for (let i = tempValues.length; i < linkReference.referencedColumnNames.length; i++) {
                        tempValues[i] = (inputObj as any)[linkReference.referencedColumnNames[i]]
                    }
                    inputObj = tempValues;
                }
                setText(getDisplayValue(inputObj))
                sendSelectRequest(props.rowNumber, filter);
                sendSetValues(props.dataRow, props.name, columnNames, props.columnName, inputObj, props.context.server, extractedLastValue as any, props.topbar, props.rowNumber);
                
            }
            else {
                if (props.cellEditor.displayReferencedColumnName) {
                    setText(getDisplayValue(inputObj));
                    sendSelectRequest(props.rowNumber, filter);
                    sendSetValues(props.dataRow, props.name, columnNames, props.columnName, inputObj[refColNames[0]], props.context.server, convertColNamesToReferenceColNames(extractedLastValue, props.cellEditor.linkReference, props.columnName)[refColNames[0]], props.topbar, props.rowNumber);
                }
                else {
                    setText(getDisplayValue(inputObj));
                    sendSelectRequest(props.rowNumber, filter);
                    sendSetValues(props.dataRow, props.name, columnNames, props.columnName, inputObj[refColNames[index]], props.context.server, extractedLastValue[props.columnName], props.topbar, props.rowNumber);
                }
            }
        }
    }

    /**
     * Handles the input, when the text is entered manually and sends the value to the server
     * if the corresponding row is found in its databook. if it isn't, the state is set back to its previous value
     */
     const handleInput = (value?:string) => {
        const linkReference = props.cellEditor.linkReference;

        const refColNames = linkReference.referencedColumnNames;
        const colNames = linkReference.columnNames;
        const index = colNames.findIndex(col => col === props.columnName);

        let checkText = text;

        if (value) {
            checkText = value;
        }

        /** Returns the values, of the databook, that match the input of the user */
        // check if providedData has entries of text
        let foundData = 
            providedData.filter((data: any) => {
                if (isDisplayRefColNameOrConcat) {
                    const extractedData = getExtractedObject(data, refColNames);
                    if (getDisplayValue(extractedData)) {
                        return getDisplayValue(extractedData).toString().includes(checkText);
                    }
                    return !checkText;
                }
                else {
                    if (data && data[refColNames[index]]) {
                        if (typeof data[refColNames[index]] !== "string") {
                            data[refColNames[index]].toString().includes(checkText);
                        }
                        else {
                            return data[refColNames[index]].includes(checkText);
                        }
                    }
                    else {
                        return false;
                    }
                }
                return false
            });

        foundData = Array.isArray(foundData) ? foundData : [foundData];

        const extractedLastValue = getExtractedObject(lastValue.current, colNames);

        /** If the text is empty, send null to the server to deselect */
        if (!checkText) {
            sendSelectRequest(-1, null)
            sendSetValues(props.dataRow, props.name, colNames, props.columnName, null, props.context.server, extractedLastValue as any, props.topbar, props.rowNumber);
        }
        /** If there is a match found send the value to the server */
        if (foundData.length === 1) {
            const extractedData = getExtractedObject(foundData[0], refColNames) as any;
            const extractedPrimaryKeys = getExtractedObject(foundData[0], primaryKeys) as any;
            let filter:SelectFilter = {
                columnNames: primaryKeys,
                values: primaryKeys.map(pk => extractedPrimaryKeys[pk])
            };

            if (_.isEqual(extractedData, convertColNamesToReferenceColNames(extractedLastValue, props.cellEditor.linkReference, props.columnName))) {
                // lastvalue needs to be converted to referenceColumnNames because dataToDisplay Map is built from referenceColumnNames
                setText(getDisplayValue(isDisplayRefColNameOrConcat ? convertColNamesToReferenceColNames(extractedLastValue, props.cellEditor.linkReference, props.columnName) : extractedLastValue));
            }
            else {
                if (colNames.length > 1) {
                    let tempValues = Object.values(extractedData)
                    if (colNames.length > tempValues.length) {
                        for (let i = tempValues.length; i < linkReference.referencedColumnNames.length; i++) {
                            tempValues[i] = (extractedData as any)[linkReference.referencedColumnNames[i]]
                        }
                    }
                    setText(getDisplayValue(convertReferenceColNamesToColNames(extractedData, props.cellEditor.linkReference)))
                    sendSelectRequest(props.rowNumber, filter)
                    sendSetValues(props.dataRow, props.name, colNames, props.columnName, tempValues, props.context.server, extractedLastValue as any, props.topbar, props.rowNumber);
                }
                else {
                    setText(getDisplayValue(extractedData))
                    sendSelectRequest(props.rowNumber, filter)
                    sendSetValues(props.dataRow, props.name, colNames, props.columnName, extractedData, props.context.server, convertColNamesToReferenceColNames(extractedLastValue, props.cellEditor.linkReference, props.columnName), props.topbar, props.rowNumber);
                }

            }
        }
        /** If there is no match found set the old value except if validationenabled is false */
        else {
            if (props.cellEditor.validationEnabled === false) {
                let tempArray = [];
                for (let i = 0; i < colNames.length; i++) {
                    if (colNames[i] !== props.columnName) {
                        tempArray.push(null);
                    }
                    else {
                        tempArray.push(checkText);
                    }
                }
                sendSetValues(props.dataRow, props.name, colNames, props.columnName, tempArray, props.context.server, lastValue.current, props.topbar, props.rowNumber)
            }
            else {
                setText(getDisplayValue(isDisplayRefColNameOrConcat ? convertColNamesToReferenceColNames(extractedLastValue, props.cellEditor.linkReference, props.columnName) : extractedLastValue));
            }
            
        }
    }

    /**
     * Returns the suggestions to display at the dropdownlist
     * @param values - The values which should be suggested
     * @returns the suggestions to display at the dropdownlist
     */
    const buildSuggestions = (values:any) => {
        let suggestions:any = [];
        if (values.length > 0) {
            values.forEach((value:any) => {
                suggestions.push(buildSuggestionArray(value));
            });
        }
        return suggestions
    }

    // Handles the lazy-load, if the linked is at the end but not every row is fetched, it fetches 400 new rows
    const handleLazyLoad = (event:any) => {
        if (event.last >= providedData.length && !props.context.contentStore.getDataBook(props.screenName, props.cellEditor.linkReference.referencedDataBook || "")?.allFetched) {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = props.cellEditor.linkReference.referencedDataBook;
            fetchReq.fromRow = providedData.length;
            fetchReq.rowCount = 400;
            showTopBar(props.context.server.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH), props.topbar)
            .then(result => {
                if (props.onLazyLoadFetch && result[0]) {
                    props.onLazyLoadFetch(props.context.server.buildDatasets(result[0]))
                }
            })
        }
    }

    // Creates an item-template when linked-overlay is displayed as table
    const itemTemplate = useCallback((d:any[], index) => {
        if (props.cellEditor.displayReferencedColumnName) {
            return providedData[index][props.cellEditor.displayReferencedColumnName];
        }
        else {
            const suggestionObj = unpackSuggestionArray(d, "display");
            return Object.values(suggestionObj).map((d:any, i:number) => {
                const cellStyle: CSSProperties = {}
                let icon: JSX.Element | null = null;

                if (providedData[index].__recordFormats && providedData[index].__recordFormats[props.name] && providedData[index].__recordFormats[props.name].length && providedData[index].__recordFormats[props.name][i]) {
                    const format = providedData[index].__recordFormats[props.name][i]

                    if (format.background) {
                        cellStyle.background = format.background;
                    }

                    if (format.foreground) {
                        cellStyle.color = format.foreground;
                    }

                    if (format.font) {
                        const font = getFont(format.font);
                        if (font) {
                            cellStyle.fontFamily = font.fontFamily;
                            cellStyle.fontWeight = font.fontWeight;
                            cellStyle.fontStyle = font.fontStyle;
                            cellStyle.fontSize = font.fontSize;
                        }
                    }

                    if (format.image) {
                        const iconData = parseIconData(format.foreground, format.image);
                        if (iconData.icon) {
                            if (isFAIcon(iconData.icon)) {
                                icon = <i className={iconData.icon} style={{ fontSize: iconData.size?.height, color: iconData.color }} />
                            }
                            else {
                                icon = <img
                                    alt="icon"
                                    src={props.context.server.RESOURCE_URL + iconData.icon}
                                    style={{ width: `${iconData.size?.width}px`, height: `${iconData.size?.height}px` }} />
                            }
                        }
                        else {
                            icon = null;
                        }
                    }
                }
                return <div style={cellStyle} key={i}>{icon ?? d}</div>
            })
        }

    }, [providedData, metaData]);

    // Creates a header for the table when linked-overlay is in table-mode
    const groupedItemTemplate = useCallback(d => {
        return (d.label as string[]).map((d, i) => <div key={i}>{metaDataReferenced?.columns[i]?.label ?? props.columnMetaData?.label ?? d}</div>)
    }, [props.columnMetaData, providedData, metaDataReferenced]);

    const getScrollHeight = () => {
        if (tableOptions) {
            if (props.cellEditor.tableHeaderVisible === false) {
                return (providedData.length * 38 > 200) ? "200px" : `${providedData.length * 38}px`
            }
            else {
                // +44 for table header uncomment, when table header is available again
                //return ((providedData.length) * 38 + 44) > 200 ? "200px" : `${(providedData.length) * 38 + 44}px`
                return ((providedData.length) * 38 + 44) > 200 ? "200px" : `${(providedData.length) * 38}px`
            }
        }
        else {
            return (providedData.length * 38) > 200 ? "200px" : `${providedData.length * 38}px`
        }
    }

    useEventHandler(linkedInput.current && props.isCellEditor ? linkedInput.current : undefined, "keydown", () => {
        setTimeout(() => linkedInput.current.focus(), 0);
    })

    return (
        <span 
            ref={wrapperRef}
            aria-label={props.ariaLabel} 
            {...usePopupMenu(props)} 
            style={{
                ...props.layoutStyle
            } as CSSProperties}>
            <AutoComplete
                ref={linkedRef}
                id={!props.isCellEditor ? props.name : undefined}
                style={{ 
                    width: 'inherit',
                    height: 'inherit',
                    '--background': btnBgd,
                    '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                }}
                inputRef={linkedInput}
                autoFocus={props.autoFocus ? true : props.isCellEditor ? true : false}
                appendTo={document.body}
                className={concatClassnames(
                    "rc-editor-linked", 
                    props.columnMetaData?.nullable === false ? "required-field" : "",
                    props.isCellEditor ? "open-cell-editor" : undefined,
                    props.focusable === false ? "no-focus-rect" : "",
                    props.style
                )}
                inputClassName={props.isReadOnly ? "rc-input-readonly" : ""}
                panelClassName={concatClassnames(
                    "rc-editor-linked-dropdown",
                    "dropdown-" + props.name, props.isCellEditor ? "dropdown-celleditor" : "", 
                    props.cellEditor.tableHeaderVisible === false ? "no-table-header" : "",
                    tableOptions ? "dropdown-table" : "",
                    linkedInput.current?.offsetWidth < 120 ? "linked-min-width" : ""
                )}
                scrollHeight={getScrollHeight()}
                inputStyle={{
                    ...textAlignment, 
                    ...props.cellStyle,
                    borderRight: "none" 
                }}
                disabled={props.isReadOnly}
                dropdown
                completeMethod={event => sendFilter(event.query)}
                suggestions={buildSuggestions(providedData)}
                value={text}
                onChange={event => {
                    if (isDisplayRefColNameOrConcat && Array.isArray(event.target.value)) {
                        setText(getDisplayValue(unpackValue(event.target.value)));
                    }
                    else {
                        setText(unpackValue(event.target.value));
                    }
                }}
                onFocus={() => {
                    if (!focused.current) {
                        focused.current = true;
                        setTimeout(() => onFocusGained(props.name, props.context.server), 0);
                    }
                }}
                onBlur={event => {
                    if (!props.isReadOnly) {
                        if (props.onBlur) {
                            props.onBlur(event);
                        }
                        handleInput();
                        const dropDownElem = document.getElementsByClassName("dropdown-" + props.name)[0];
                        // Check if the relatedTarget isn't in the dropdown and only then send focus lost. Linked also wants to send blur when clicking the overlay.
                        if (dropDownElem) {
                            if (!linkedRef.current.container.contains(event.relatedTarget) && !dropDownElem.contains(event.relatedTarget as Node)) {
                                if (props.eventFocusLost) {
                                    onFocusLost(props.name, props.context.server);
                                }
                                focused.current = false;
                                //(linkedRef.current as any).hideOverlay();
                            }
                            
                        }
                        else if (!linkedRef.current.container.contains(event.relatedTarget)) {
                            if (props.eventFocusLost) {
                                onFocusLost(props.name, props.context.server);
                            }
                            focused.current = false
                        }
                    }
                }}
                virtualScrollerOptions={{ itemSize: 38, lazy: true, onLazyLoad: handleLazyLoad, className: props.isCellEditor ? "celleditor-dropdown-virtual-scroller" : "dropdown-virtual-scroller" }}
                onSelect={(event) => { 
                    if (props.onSelect) {
                        props.onSelect(event);
                    }
                    handleSelect(event.value)
                }}
                tooltip={props.toolTipText}
                tooltipOptions={{ position: "left" }}
                itemTemplate={itemTemplate}
                {...(tableOptions ? {
                    //optionGroupLabel: "label",
                    //optionGroupChildren: "items",
                    optionGroupTemplate: groupedItemTemplate
                } : {})}
                placeholder={props.cellEditor_placeholder_}
                tabIndex={props.isCellEditor ? -1 : getTabIndex(props.focusable, props.tabIndex)}
            />
        </span>
    )
}
export default UIEditorLinked