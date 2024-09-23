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
import { handleFocusGained, onFocusLost } from "../../../util/server-util/FocusUtil";
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
import { SelectFilter } from "../../../request/data/SelectRowRequest";
import { IComponentConstants } from "../../BaseComponent";
import { CellFormatting } from "../../table/CellEditor";
import { objectToString } from "../../../util/string-util/ObjectToString";

interface ReferencedColumnNames {
    columnNames: string[]
    referencedColumnNames: string[]
}

// Type for linkreferences
interface LinkReference extends ReferencedColumnNames {
    referencedDataBook: string
    dataToDisplayMap?: Map<string, string>
}

// Type for AdditionalConditions
type AdditionalConditionsType = {
    conditions?: AdditionalConditionType[],
    condition?: AdditionalConditionType,
    type: string
}

// Type for a single additionalcondition
type AdditionalConditionType = {
    columnName: string,
    dataRow: string | undefined,
    dataRowColumnName: string,
    ignoreNull: boolean,
    type: string,
    value: any
}

/** Interface for cellEditor property of LinkedCellEditor */
export interface ICellEditorLinked extends ICellEditor {
    additionalCondition?: AdditionalConditionsType | AdditionalConditionType
    linkReference: LinkReference
    columnView: {
        columnCount: number
        columnNames: Array<string>
        rowDefinitions: Array<any>
    }
    additionalClearColumns:Array<string>
    clearColumns:Array<string>
    displayReferencedColumnName?:string
    tableHeaderVisible?:boolean
    displayConcatMask?: string,
    searchColumnMapping?: ReferencedColumnNames
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
    if (selectedRecord !== undefined
        && (displayCol || concatMask)
        && (!refDataBookInfo?.data)
        && !server.missingDataFetches.includes(databook)) {
        server.missingDataFetches.push(databook);
        const fetchReq = createFetchRequest();
        fetchReq.dataProvider = databook;
        fetchReq.fromRow = 0;
        fetchReq.rowCount = -1;
        if (!refDataBookInfo?.metaData) {
            fetchReq.includeMetaData = true;
        }
        fetchReq.screenName = screenName;
        server.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH).then(() => decreaseCallback ? decreaseCallback(databook) : undefined)
    }
}

/**
 * Returns an object with the extracted key, value pairs that were provided
 * @param value - the object to be extracted
 * @param keys - the keys you want to extract
 */
export function getExtractedObject(value:any|undefined, keys:string[]):any {
    function toString(o: any) {
        if (o) {
            Object.keys(o).forEach(k => {
                if (typeof o[k] === 'object') {
                    return toString(o[k]);
                }
    
                o[k] = '' + o[k];
            });
    
            return o;
        }
    }

    return toString(_.pick(value, keys) as any);
}

/**
 * Maps the columnNames of a row to the referencedColumnNames of a searchColumnMapping and adds it to the keyObject for the dataDisplayMap
 * @param dataRow - the dataRow which is being mapped
 * @param referencedObject - an object with key-value pairs already from the referencedDatabook
 * @param keyObject - the object which will be edited and used as the key
 * @param cellEditorMetaData - the metadata of the celleditor
 */
function addSearchColumnMappingToKeyObject(dataRow: any, referencedObject: any, keyObject: any, cellEditorMetaData: ICellEditorLinked) {
    const searchColumnMapping = cellEditorMetaData.searchColumnMapping
    if (searchColumnMapping) {
        searchColumnMapping.columnNames.forEach((columnName, i) => {
            keyObject[searchColumnMapping.referencedColumnNames[i]] = referencedObject ? dataRow[searchColumnMapping.referencedColumnNames[i]] : dataRow[columnName];
        })
    }
}

/**
 * True, if the given additionalCondition is a singular additionalCondition with no conditions array
 * @param additionalCondition - the additionalCondition to check
 */
function isAdditionalConditionType(additionalCondition: AdditionalConditionsType | AdditionalConditionType): additionalCondition is AdditionalConditionType {
    return (additionalCondition as AdditionalConditionType).columnName !== undefined
}

/**
 * Recursivley goes through the given additionalCondition and adds key value pairs to the key to get the correct dataToDisplay value
 * @param dataRow - the dataRow which is being checked
 * @param referencedObject - an object with key-value pairs already from the referencedDatabook
 * @param keyObject - the object which will be edited and used as the key
 * @param additionalCondition - the additionalCondition to check
 * @param dataProvider - the dataprovider
 */
export function recurseAdditionalConditions(dataRow: any, referencedObject: any, keyObject: any, additionalCondition: AdditionalConditionsType | AdditionalConditionType, dataProvider: string) {
    if (isAdditionalConditionType(additionalCondition)) {
        // Only use Equals conditions (or when there is no type: backwards compability)
        if (!additionalCondition.type || additionalCondition.type === "Equals") {
            // If dataProvider is build map then the map is initially built, then the dataRow already contains the referencedColumnNames
            if (dataProvider === "build-map") {
                keyObject[additionalCondition.columnName] = dataRow[additionalCondition.columnName]
            }
            else {
                // Check if the dataRow of the additionalCondition is the given dataProvider, if yes, use the value of the column of the datarow, if not, use the value of the additionalCondition
                keyObject[additionalCondition.columnName] = additionalCondition.dataRow === dataProvider ? dataRow[additionalCondition.dataRowColumnName] : additionalCondition.value;
            }
        }
    }
    else {
        if (additionalCondition.conditions) {
            additionalCondition.conditions.forEach(addCon => recurseAdditionalConditions(dataRow, referencedObject, keyObject, addCon, dataProvider));
        }
        else if (additionalCondition.condition) {
            recurseAdditionalConditions(dataRow, referencedObject, keyObject, additionalCondition.condition, dataProvider); 
        }
    }
}

/**
 * Returns the generated key for the dataToDisplayMap
 * @param dataRow - the dataRow which is being checked
 * @param referencedObject - an object with key-value pairs already from the referencedDatabook
 * @param linkReference - the linkreference of the celleditor metadata
 * @param columnName - the columnName
 * @param isDisplayRefColNameOrConcat - not undefined if there is a displayReferencedColumnName or displayConcatMask 
 * @param cellEditorMetaData - the metadata of the celleditor
 * @param dataProvider - the dataprovider
 */
export function generateDisplayMapKey(dataRow:any, referencedObject: any, linkReference: LinkReference, columnName: string, 
                                isDisplayRefColNameOrConcat: string | undefined, cellEditorMetaData: ICellEditorLinked | undefined, dataProvider: string) {
    if (isDisplayRefColNameOrConcat) {
        if (linkReference) {
            let keyObject: any = {};
            const index = linkReference.columnNames.findIndex(colName => colName === columnName);

            if (cellEditorMetaData) {
                addSearchColumnMappingToKeyObject(dataRow, referencedObject, keyObject, cellEditorMetaData);

                if (cellEditorMetaData.additionalCondition) {
                    recurseAdditionalConditions(dataRow, referencedObject, keyObject, cellEditorMetaData.additionalCondition, dataProvider)
                }
                
            }

            keyObject[linkReference.referencedColumnNames[index]] = referencedObject ? referencedObject[linkReference.referencedColumnNames[index]] : dataRow[linkReference.columnNames[index]];
            
            const key = objectToString(keyObject);
            return key;
        }
    }
    return dataRow;
}

/**
 * Returns the value which should be displayed in the linkedcelleditor input.
 * Usually take the bound column but when there is a displayReferencedColumnname or a concat-mask,
 * check the dataToDisplayMap in the linkReference and pick the correct value by stringifying the selected object.
 */
export function getDisplayValue(value:any, referencedObject: any, linkReference: LinkReference, columnName: string, 
                         isDisplayRefColNameOrConcat: string | undefined, cellEditorMetaData: ICellEditorLinked | undefined, dataProvider: string) {
    if (value) {
        const index = linkReference.columnNames.findIndex(colName => colName === columnName);
        if (isDisplayRefColNameOrConcat) {
            const displayObject = generateDisplayMapKey(value, referencedObject, linkReference, columnName, isDisplayRefColNameOrConcat, cellEditorMetaData, dataProvider);
            const extractedObject = getExtractedObject(displayObject, [linkReference.referencedColumnNames[index]]);
            
            if (cellEditorMetaData) {
                if (cellEditorMetaData.additionalCondition || cellEditorMetaData.searchColumnMapping) {
                    if (linkReference.dataToDisplayMap?.has(JSON.stringify(displayObject))) {
                        return linkReference.dataToDisplayMap!.get(JSON.stringify(displayObject));
                    }
                }

                if (linkReference.dataToDisplayMap?.has(JSON.stringify(extractedObject))) {
                    return linkReference.dataToDisplayMap!.get(JSON.stringify(extractedObject));
                }
            }
        }

        // if (props.selectedRow && props.selectedRow.data[props.columnName]) {
        //     return props.selectedRow.data[props.columnName];
        // }

        if (referencedObject) {
            return referencedObject[linkReference.referencedColumnNames[index]]
        }

        return value[columnName];
    }
    return ""
};

/**
 * This component displays an input field with a button which provides a dropdownlist with values of a databook
 * when text is entered into the inputfield, the dropdownlist gets filtered
 * @param props - Initial properties sent by the server for this component
 */
const UIEditorLinked: FC<IEditorLinked & IExtendableLinkedEditor & IComponentConstants> = (props) => {
    /** Reference for the LinkedCellEditor element */
    const linkedRef = useRef<AutoComplete>(null);

    /** Reference for the LinkedCellEditor input element */
    const linkedInput = useRef<any>(null);

    /** The data provided by the databook */
    const [providedData] = useDataProviderData(props.screenName, props.cellEditor.linkReference.referencedDataBook||"");

    /** True, if the user has changed the value */
    const startedEditing = useRef<boolean>(false);

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
    //const linkRefFetchFlag = useMemo(() => providedData.length > 0, [providedData]);

    // Return the linkReference of the celleditormetadata if there is one else use the linkReference of the celleditor properties
    const linkReference = useMemo(() => {
        if (cellEditorMetaData && cellEditorMetaData.linkReference) {
            return cellEditorMetaData.linkReference
        }
        return props.cellEditor.linkReference;
    }, [cellEditorMetaData, props.cellEditor.linkReference])

    /** A flag, which changes when the displaymap of the metadata changes */
    const [displayMapChanged, setDisplayMapChanged] = useState<boolean>(false);

    /** Current state of text value of input element */
    const [text, setText] = useState(getDisplayValue(props.selectedRow ? props.selectedRow.data  : undefined, undefined, linkReference, props.columnName, isDisplayRefColNameOrConcat, cellEditorMetaData, props.dataRow));

    /** Extracting onLoadCallback and id from props */
    const {onLoadCallback, id} = props;

    /** The horizontal- and vertical alignments */
    const textAlignment = useMemo(() => getTextAlignment(props), [props]);

    /** True, if the CellEditor is currently focused */
    const focused = useRef<boolean>(false);

    /** True if the initialFilter has been set */
    const [initialFilter, setInitialFilter] = useState<boolean>(false);

    /** Button background */
    const btnBgd = useMemo(() => window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color'), [props.designerUpdate]);

    /** True, if a table should always been shown */
    const showTable = false;

    /** True, if there is currently a filter being processed */
    const filterInProcess = useRef<boolean>(false);

    /** Remember to call handleInput */
    const callHandleInputCallback = useRef<boolean>(false);

    /** True, if the dropdown should be displayed as table */
    const tableOptions = useMemo(() => {
        if (!showTable && isDisplayRefColNameOrConcat) {
            return false;
        }
        else if (props.cellEditor.columnView) {
            return props.cellEditor.columnView.columnCount > 1;
        }
        else if (metaDataReferenced) {
            return metaDataReferenced.columnView_table_.length > 1;
        }
        return false
    }, [props.cellEditor.columnView, metaDataReferenced]); 

    /** If the columnView of the celleditor is empty use "columnView_table of the referenced databook instead" */
    const columnViewNames = useMemo(() => props.cellEditor.columnView ? props.cellEditor.columnView.columnNames : metaDataReferenced ? metaDataReferenced.columnView_table_ : [], [props.cellEditor.columnView, metaDataReferenced]);

    // Helper to set the text on unmount
    const textCopy = useRef<any>(text);

    // Use the primaryKeyColumns from the referenced metadata or use the referencedColumnNames if empty.
    const primaryKeys:string[] = useMemo(() => {
        if (metaDataReferenced) {
            if (metaDataReferenced.primaryKeyColumns) {
                return metaDataReferenced.primaryKeyColumns;
            }
        }
        return linkReference.referencedColumnNames;
    }, [metaDataReferenced]);

    /** Handles the requestFocus property */
    useRequestFocus(id, props.requestFocus, linkedInput.current, props.context);

    /** Returns the element of the dropdownbutton or null */
    const getDropDownButton = (): HTMLButtonElement|null => {
        if (linkedRef.current) {
            return linkedRef.current.getElement().querySelector("button");
        }
        return null;
    }

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && props.forwardedRef.current) {
            sendOnLoadCallback(id, props.cellEditor.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), props.forwardedRef.current, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    // Subscribes to displaymap change
    useEffect(() => {
        props.context.subscriptions.subscribeToLinkedDisplayMap(props.screenName, props.cellEditor.linkReference.referencedDataBook, () => setDisplayMapChanged(prevState => !prevState));

        return () => props.context.subscriptions.unsubscribeFromLinkedDisplayMap(props.screenName, props.cellEditor.linkReference.referencedDataBook, () => setDisplayMapChanged(prevState => !prevState));
    },[props.context.subscriptions])

    /** disable dropdownbutton tabIndex */
    useEffect(() => {
        const dropDownButton = getDropDownButton();
        if (dropDownButton) {
            dropDownButton.tabIndex = -1;
        }

        if (props.isCellEditor && props.passedKey) {
            setText("");
        }

        //on unmount save the value, use textcopy because text would be empty
        return () => {
            if (props.context.contentStore.activeScreens.map(screen => screen.name).indexOf(props.screenName) !== -1 && linkedInput.current && props.isCellEditor && startedEditing.current) {
                handleInput(textCopy.current)
            }
        }
    }, []);

    // Disable the dropdown-button if the editor is set to readonly
    useEffect(() => {
        const dropdownButton = getDropDownButton();
        if (dropdownButton) {
            if (props.isReadOnly) {
                if (!dropdownButton.disabled) {
                    dropdownButton.disabled = true;
                }
                
            }
            else if (dropdownButton.disabled) {
                dropdownButton.disabled = false;
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
            props.selectedRow && props.selectedRow.data !== undefined ? props.selectedRow.data : undefined, 
            props.cellEditor.displayReferencedColumnName ?? props.columnName,
            props.cellEditor.displayConcatMask,
            props.context.server, 
            props.context.contentStore, props.name);
    }, [props.selectedRow])

    // Add this editor as referencedCellEditor to it's referencedDatabook to update the displaymap
    useEffect(() => {
        if (cellEditorMetaData) {
            if (!cellEditorMetaData.linkReference) {
                props.context.contentStore.createReferencedCellEditors(props.screenName, props.cellEditor, props.columnName, props.dataRow)
            }
        }
    }, [])

    /** When props.selectedRow changes set the state of inputfield value to props.selectedRow*/
    useEffect(() => {
        if (props.selectedRow) {            
            setText(getDisplayValue(props.selectedRow.data, undefined, linkReference, props.columnName, isDisplayRefColNameOrConcat, cellEditorMetaData, props.dataRow));
        }
    }, [props.selectedRow, cellEditorMetaData, displayMapChanged]);

    // If the lib user extends the LinkedCellEditor with onChange, call it when slectedRow changes.
    useEffect(() => {
        if (props.onChange) {
            props.onChange(cellEditorMetaData?.linkReference?.dataToDisplayMap?.get(props.selectedRow ? props.selectedRow.data : undefined))
        }
    }, [props.selectedRow, props.onChange, cellEditorMetaData])

    /**
     * Incase of no displayReferencedColumn or concatMask, return the correct value to display
     * else create an object of the referencedColumnNames as keys and their values
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
     * @param query - True, if the sendFilter is being called by querying
     */
    const sendFilter = useCallback(async (value:any, query?:boolean) => {
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

        // Only set filterInProcess if not querying = keyboard inputs!
        if (!filterInProcess.current && !query) {
            filterInProcess.current = true;
        }
        
        await props.context.server.sendRequest(filterReq, REQUEST_KEYWORDS.FILTER).then(() => {
            if (!initialFilter) {
                setInitialFilter(true);
            }

            if (callHandleInputCallback.current) {
                handleInput();
            }
            filterInProcess.current = false;
        });
    }, [props.context.contentStore, props.context.server, props.cellEditor, props.name, props.cellEditor.linkReference.referencedDataBook, callHandleInputCallback.current, filterInProcess.current]);

    // If autoOpenPopup is true and preferredEditorMode is 1 (singleclick) and it is a table-cell-editor, open the overlay directly and send an empty filter
    useEffect(() => {
        setTimeout(() => {
            if(linkedRef.current && props.cellEditor.autoOpenPopup && (props.cellEditor.preferredEditorMode === 1 && props.isCellEditor)) {
                sendFilter("");
                linkedRef.current.show()
            }
        }, 33)

    }, [props.cellEditor.autoOpenPopup, props.cellEditor.preferredEditorMode, props.isCellEditor, sendFilter]);

    // Sends an focus-gained event to the server
    useEffect(() => {
        if (focused.current && initialFilter && props.eventFocusGained) {
            //setTimeout 0ms so the transition is playing
            setTimeout(() => handleFocusGained(props.name, props.cellEditor.className, props.eventFocusGained, props.focusable, undefined, props.name, props.context, props.isCellEditor), 0);
        }
    }, [initialFilter])

    /**
     * When enter is pressed "submit" the value
     */
    useEventHandler(linkedInput.current || undefined, "keydown", (event) => {
        if((event as KeyboardEvent).key === "Enter" && !document.querySelector('.p-autocomplete-item.p-highlight')) {
            linkedRef.current?.hide();
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

    /** Returns the correct columnNames */
    const getColumnNames = () => {
        let columnNamesToReturn: string[] = []
        // If there are no columnNames set and only 1 referencedColumnName, use that one as columnName
        if (linkReference.columnNames.length === 0 && linkReference.referencedColumnNames.length === 1) {
            columnNamesToReturn.push(props.columnName);
        }
        else {
            columnNamesToReturn = [...linkReference.columnNames];
        }

        // add additionalClearColumns
        if (props.cellEditor.additionalClearColumns) {
            columnNamesToReturn = [...columnNamesToReturn, ...props.cellEditor.additionalClearColumns];
        }
        
        return columnNamesToReturn
    }

    /**
     * Add the additionalClearColumns to the value which is being sent to the server
     * @param valueToSend 
     */
    const addAdditionalColumnToValue = (valueToSend: any) => {
        if (props.cellEditor.additionalClearColumns) {
            props.cellEditor.additionalClearColumns.forEach(addClearCol => {
                valueToSend[addClearCol] = null;
            });
        }
    }
 
    // Handles the selection event
    const handleSelect = (value: any) => {
        const refColNames = linkReference.referencedColumnNames;
        const colNames = linkReference.columnNames;
        const index = colNames.findIndex(col => col === props.columnName);
        const columnNames = getColumnNames();
        // value is the suggestion-array, now unpack the suggestion-array by referencedColumns and primarykeys
        let inputObj:any|any[] = getExtractedObject(value, refColNames);
        let primaryObj:any|any[] = getExtractedObject(value, primaryKeys);

        let filter:SelectFilter = {
            columnNames: primaryKeys,
            values: primaryKeys.map(pk => primaryObj[pk])
        };
        
        // fill the inputObj incase some values are missing
        if (colNames.length > 1) {
            if (colNames.length > Object.values(inputObj).length) {
                let tempValues = Object.values(inputObj);
                for (let i = tempValues.length; i < refColNames.length; i++) {
                    tempValues[i] = (inputObj as any)[refColNames[i]]
                }
                inputObj = tempValues;
            }
        }

        // If there are more than one columnName to send, send the array, else take the value of the displayReferencedColumnName or the bound columnName
        const valueToSend = colNames.length > 1 ? inputObj : props.cellEditor.displayReferencedColumnName ? inputObj[refColNames[0]] : inputObj[refColNames[index]];

        addAdditionalColumnToValue(valueToSend);
        // Set text, send selectrequest and setvalues if values are being found
        setText(getDisplayValue(value, inputObj, linkReference, props.columnName, isDisplayRefColNameOrConcat, cellEditorMetaData, props.dataRow));
        sendSelectRequest(value["__index"], filter);
        sendSetValues(props.dataRow, props.name, columnNames, props.columnName, valueToSend, props.context.server, props.topbar, -1)
        startedEditing.current = false;
    }

    /**
     * Handles the input, when the text is entered manually and sends the value to the server
     * if the corresponding row is found in its databook. if it isn't, the state is set back to its previous value
     */
     const handleInput = (value?:string) => {
        const refColNames = linkReference.referencedColumnNames;
        const colNames = linkReference.columnNames;
        const columnNames = getColumnNames();
        const index = colNames.findIndex(col => col === props.columnName);

        let checkText = text;

        if (value) {
            checkText = value;
        }

        /** Returns the values, of the databook, that match the input of the user */
        // check if providedData has entries of the entered text
        let foundData = 
            providedData.filter((data: any) => {
                if (isDisplayRefColNameOrConcat) {
                    const extractedData = getExtractedObject(data, refColNames);
                    if (getDisplayValue(data, extractedData, linkReference, props.columnName, isDisplayRefColNameOrConcat, cellEditorMetaData, props.dataRow)) {
                        return getDisplayValue(data, extractedData, linkReference, props.columnName, isDisplayRefColNameOrConcat, cellEditorMetaData, props.dataRow).toString().includes(checkText);
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

        /** If the text is empty, send null to the server to deselect */
        if (!checkText || props.cellEditor.validationEnabled === false) {
            sendSelectRequest(-1, null);
            if (props.cellEditor.clearColumns) {
                const valueToSend = _.pick(props.selectedRow.data, columnNames) as any;
                delete valueToSend.recordStatus;
                delete valueToSend["__recordFormats"];
                if (props.cellEditor.clearColumns) {
                    props.cellEditor.clearColumns.forEach(clearColumn => {
                        valueToSend[clearColumn] = null;
                    });
                }

                addAdditionalColumnToValue(valueToSend);

                if (props.cellEditor.validationEnabled === false && valueToSend[props.columnName] !== undefined) {
                    valueToSend[props.columnName] = checkText;
                }

                sendSetValues(props.dataRow, props.name, columnNames, props.columnName, valueToSend, props.context.server, props.topbar, -1)
            }
            else {
                if (props.cellEditor.validationEnabled === false) {
                    let tempArray = [];
                    for (let i = 0; i < columnNames.length; i++) {
                        if (columnNames[i] !== props.columnName) {
                            tempArray.push(null);
                        }
                        else {
                            tempArray.push(checkText);
                        }
                    }
                    sendSetValues(props.dataRow, props.name, columnNames, props.columnName, tempArray, props.context.server, props.topbar, -1);
                }
                else {
                    sendSetValues(props.dataRow, props.name, columnNames, props.columnName, null, props.context.server, props.topbar, -1);
                }
            }
        }
        /** If there is a match found send the value to the server */
        else if (foundData.length === 1) {
            const extractedData = getExtractedObject(foundData[0], refColNames) as any;
            const extractedPrimaryKeys = getExtractedObject(foundData[0], primaryKeys) as any;
            let filter:SelectFilter = {
                columnNames: primaryKeys,
                values: primaryKeys.map(pk => extractedPrimaryKeys[pk])
            };

            addAdditionalColumnToValue(extractedData);

            let tempValues = Object.values(extractedData);
            // fill the tempValues incase some values are missing
            if (colNames.length > 1) {
                if (colNames.length > tempValues.length) {
                    for (let i = tempValues.length; i < linkReference.referencedColumnNames.length; i++) {
                        tempValues[i] = (extractedData as any)[linkReference.referencedColumnNames[i]]
                    }
                }
            }
            setText(getDisplayValue(foundData, extractedData, linkReference, props.columnName, isDisplayRefColNameOrConcat, cellEditorMetaData, props.dataRow))
            sendSelectRequest(-1, filter);
            sendSetValues(props.dataRow, props.name, columnNames, props.columnName, colNames.length > 1 ? tempValues : extractedData, props.context.server, props.topbar, -1);
        }
        /** If there is no match found set the old value */
        else {
            setText(getDisplayValue(props.selectedRow.data, undefined, linkReference, props.columnName, isDisplayRefColNameOrConcat, cellEditorMetaData, props.dataRow));
        }
        startedEditing.current = false;
    }

    /**
     * makes the suggestions to display at the dropdownlist
     */
    const suggestions = useMemo(() => {
        let suggestions:any = [];
        if (providedData.length > 0) {
            providedData.forEach((value:any, i: number) => {
                const suggestion = {...value, __index: i}
                suggestions.push(suggestion);
            });
        }

        // If the columnView should display a table with more than one column, return the label and items to build the table
        if (props.cellEditor.columnView?.columnCount > 1 && tableOptions) {
            suggestions = [{
                label: props.cellEditor.columnView.columnNames,
                items: suggestions
            }]
        }

        return suggestions
    }, [providedData]);
    

    // Handles the lazy-load, if the linked is at the end but not every row is fetched, it fetches 100 new rows
    const handleLazyLoad = (event:any) => {
        if (event.last >= providedData.length && !props.context.contentStore.getDataBook(props.screenName, props.cellEditor.linkReference.referencedDataBook || "")?.isAllFetched) {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = props.cellEditor.linkReference.referencedDataBook;
            fetchReq.fromRow = providedData.length;
            fetchReq.rowCount = 100;
            showTopBar(props.context.server.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH), props.topbar)
            .then(result => {
                if (props.onLazyLoadFetch && result[0]) {
                    props.onLazyLoadFetch(props.context.server.buildDatasets(result[0]))
                }
            })
        }
    }

    // Creates an item-template when linked-overlay is displayed as table
    const itemTemplate = useCallback((d:any, index: number) => {
        if (props.cellEditor.displayReferencedColumnName) {
            return d[props.cellEditor.displayReferencedColumnName];
        }
        else if(props.columnName && !columnViewNames.length) {
            return d[props.columnName];
        }
        else if (!tableOptions && isDisplayRefColNameOrConcat) {
            return <div key={0}>{getDisplayValue(d, getExtractedObject(d, linkReference.referencedColumnNames), linkReference, props.columnName, isDisplayRefColNameOrConcat, cellEditorMetaData, props.dataRow)}</div>
        }
        else {
            const suggestionObj:Record<string, any> = getExtractedObject(d, columnViewNames);
            return Object.entries(suggestionObj).map(([key, value], i:number) => {
                const cellStyle: CSSProperties = {}
                let icon: JSX.Element | null = null;
 
                if (d.__recordFormats?.[props.name]?.has(key)) {
                    const format = d.__recordFormats[props.name].get(key) as CellFormatting;

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
                return <div style={cellStyle} key={i}>{icon ?? value}</div>
            })
        }

    }, [metaData, tableOptions]);

    // Creates a header for the table when linked-overlay is in table-mode
    const groupedItemTemplate = useCallback((labels:string[]) => {
        return labels.map((d, i) => <div key={i}>{metaDataReferenced?.columns[i]?.label ?? props.columnMetaData?.label ?? d}</div>)
    }, [props.columnMetaData, metaDataReferenced]);

    // Returns the scrollheight
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

    // focus the input field when entering keys
    useEventHandler(linkedInput.current && props.isCellEditor ? linkedInput.current : undefined, "keydown", () => {
        setTimeout(() => linkedInput.current.focus(), 0);
    })

    const handleDropdownClick = useCallback(() => {
        if(linkedRef.current?.getOverlay()) {
            linkedRef.current?.hide();
        }
    }, [linkedRef]);

    return (
        <span 
            ref={props.forwardedRef}
            aria-label={props.ariaLabel} 
            id={!props.isCellEditor ? props.name : undefined}
            {...usePopupMenu(props)} 
            style={{
                ...props.layoutStyle
            } as CSSProperties}>
            <AutoComplete
                ref={linkedRef}
                style={{ 
                    width: 'inherit',
                    height: 'inherit',
                    '--background': btnBgd,
                    '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                } as CSSProperties}
                inputRef={linkedInput}
                autoFocus={props.autoFocus ? true : props.isCellEditor ? true : false}
                appendTo={document.body}
                className={concatClassnames(
                    "rc-editor-linked", 
                    props.columnMetaData?.nullable === false ? "required-field" : "",
                    props.isCellEditor ? "open-cell-editor" : undefined,
                    props.focusable === false ? "no-focus-rect" : "",
                    props.borderVisible === false ? "invisible-border" : "",
                    props.isReadOnly ? "rc-input-readonly" : "",
                    props.styleClassNames
                )}
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
                readOnly={props.isReadOnly}
                //disabled={props.isReadOnly}
                dropdown
                onDropdownClick={handleDropdownClick}
                completeMethod={event => sendFilter(event.query, true)}
                suggestions={suggestions}
                value={text}
                onChange={event => {
                    startedEditing.current = true;
                    sendFilter(event.value)
                    if (isDisplayRefColNameOrConcat && Array.isArray(event.target.value)) {
                        setText(getDisplayValue(event.target.value, unpackValue(event.target.value), linkReference, props.columnName, isDisplayRefColNameOrConcat, cellEditorMetaData, props.dataRow));
                    }
                    else {
                        setText(unpackValue(event.target.value));
                    }
                }}
                onFocus={(event) => {
                    if (!focused.current) {
                        focused.current = true;
                        setTimeout(() => handleFocusGained(props.name, props.cellEditor.className, props.eventFocusGained, props.focusable, event, props.name, props.context, props.isCellEditor), 0);
                    }
                }}
                onBlur={event => {
                    if (!props.isReadOnly) {
                        if (props.onBlur) {
                            props.onBlur(event);
                        }

                        if (startedEditing.current) {
                            if (!filterInProcess.current) {
                                handleInput();
                            }
                            else {
                                // if a filter is in process wait for it and then call handleInput
                                callHandleInputCallback.current = true;
                            }
                        }

                        const dropDownElem = document.getElementsByClassName("dropdown-" + props.name)[0];
                        // Check if the relatedTarget isn't in the dropdown and only then send focus lost. Linked also wants to send blur when clicking the overlay.
                        if (dropDownElem) {
                            if (!linkedRef.current?.getElement().contains(event.relatedTarget) && !dropDownElem.contains(event.relatedTarget as Node)) {
                                if (props.eventFocusLost) {
                                    onFocusLost(props.name, props.context.server);
                                }
                                focused.current = false;
                            }
                            
                        }
                        else if (!linkedRef.current?.getElement().contains(event.relatedTarget)) {
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
                tooltipOptions={{ position: "left", showDelay: 800 }}
                itemTemplate={itemTemplate}
                {...(tableOptions ? {
                    optionGroupLabel: "label",
                    optionGroupChildren: "items",
                    optionGroupTemplate: groupedItemTemplate
                } : {})}
                placeholder={props.cellEditor_placeholder_}
                tabIndex={props.isCellEditor ? -1 : getTabIndex(props.focusable, props.tabIndex)}
            />
        </span>
    )
}
export default UIEditorLinked