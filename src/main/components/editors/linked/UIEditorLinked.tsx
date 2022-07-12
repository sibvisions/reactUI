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
import { createFetchRequest, createFilterRequest } from "../../../factories/RequestFactory";
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

/** Interface for cellEditor property of LinkedCellEditor */
export interface ICellEditorLinked extends ICellEditor {
    linkReference: {
        referencedDataBook: string
        columnNames: string[]
        referencedColumnNames: string[]
    }
    columnView: {
        columnCount: number
        columnNames: Array<string>
        rowDefinitions: Array<any>

    }
    clearColumns:Array<string>
    displayReferencedColumnName?:string
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
export function fetchLinkedRefDatabook(screenName:string, databook: string, selectedRecord:any, displayCol: string|null|undefined, server: Server|ServerFull, contentStore: BaseContentStore) {
    const refDataBookInfo = contentStore.getDataBook(screenName, databook)
    if (selectedRecord
        && displayCol
        && !refDataBookInfo?.data
        && !server.missingDataFetches.includes(databook)) {
        server.missingDataFetches.push(databook);
        const fetchReq = createFetchRequest();
        fetchReq.dataProvider = databook
        if (refDataBookInfo?.metaData) {
            fetchReq.includeMetaData = true;
        }
        server.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH);
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

    /** Reference for the LinkedCellEditor input element */
    const linkedInput = useRef<any>(null);

    /** The data provided by the databook */
    const [providedData] = useDataProviderData(props.screenName, props.cellEditor.linkReference.referencedDataBook||"");

    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();

    /** The last displayed-value in the cell-editor (displayRefernecedColumnName) */
    const lastDisplayValue = useRef<any>();

    /** Current state of text value of input element */
    const [text, setText] = useState(props.selectedRow);

    /** True if the linkRef has already been fetched */
    const linkRefFetchFlag = useMemo(() => providedData.length > 0, [providedData]);

    /** A map which stores the referenced-column-values as keys and the display-values as value */
    const displayValueMap = useMemo(() => {
        const map = new Map<string, string>();
        if (providedData.length && props.cellEditor.displayReferencedColumnName) {
            providedData.forEach((data:any) => map.set(data[props.cellEditor.linkReference.referencedColumnNames[0]], data[props.cellEditor.displayReferencedColumnName as string]))
        }
        return map;
    }, [providedData]);

    /** Extracting onLoadCallback and id from props */
    const {onLoadCallback, id} = props;

    /** The horizontal- and vertical alignments */
    const textAlignment = useMemo(() => getTextAlignment(props), [props]);

    /** True, if the dropdown should be displayed as table */
    const tableOptions = props.cellEditor.columnView?.columnCount > 1;

    /** True, if the CellEditor is currently focused */
    const focused = useRef<boolean>(false);

    const [initialFilter, setInitialFilter] = useState<boolean>(false);

    /** Button background */
    const btnBgd = window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color');

    const metaData:MetaDataResponse = useMetaData(props.screenName, props.cellEditor.linkReference.referencedDataBook||"") as MetaDataResponse;

    /** Hook for MouseListener */
    useMouseListener(props.name, linkedRef.current ? linkedRef.current.container : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && linkedRef.current) {
            sendOnLoadCallback(id, props.cellEditor.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), linkedRef.current.container, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    /** disable dropdownbutton tabIndex */
    useEffect(() => {
        const autoRef: any = linkedRef.current
        if (autoRef) {
            autoRef.dropdownButton.tabIndex = -1;
        }

        if (props.isCellEditor && props.passedKey) {
            setText("");
        }
    }, []);

    /** If there is a selectedRow to display, a display-referenced-column and it hasn't been fetched yet, then fetch the reference-databook */
    useEffect(() => {
        fetchLinkedRefDatabook(
            props.screenName, 
            props.cellEditor.linkReference.referencedDataBook, 
            props.selectedRow, 
            props.cellEditor.displayReferencedColumnName, 
            props.context.server, 
            props.context.contentStore);
    }, [props.selectedRow])

    /** When props.selectedRow changes set the state of inputfield value to props.selectedRow and update lastValue reference */
    useEffect(() => {
        if (props.cellEditor.displayReferencedColumnName) {
            if (displayValueMap.has(props.selectedRow)) {
                setText(displayValueMap.get(props.selectedRow));
                lastDisplayValue.current = displayValueMap.get(props.selectedRow)
            }
            // else {
            //     setText("");
            // }
        }
        else if (lastValue.current !== props.selectedRow) {
            setText(props.selectedRow);
        }
        lastValue.current = props.selectedRow;
    }, [props.selectedRow, linkRefFetchFlag]);

    // If the lib user extends the LinkedCellEditor with onChange, call it when slectedRow changes.
    useEffect(() => {
        if (props.onChange) {
            if (props.cellEditor.displayReferencedColumnName) {
                if (displayValueMap.has(props.selectedRow)) {
                    props.onChange(displayValueMap.get(props.selectedRow))
                }
            }
            else {
                props.onChange(props.selectedRow)
            }
        }
    }, [props.selectedRow, linkRefFetchFlag, props.onChange])

    /**
     * Either returns the unpacked value out of an array based on the columnView which should be shown in the input , or just returns the value if there is no array
     * @param value - the selected value of the linked-cell-editor
     */
    const unpackValue = (value: string | string[]) => {
        // If the value is an array, get the index of the link-cell-editor column in the linkReference.
        // Then use this index with the referencedColumnNames to find the column in the columnView and return the correct value.
        if (Array.isArray(value)) {
            const colNameIndex = props.cellEditor.linkReference.columnNames.findIndex(columnName => columnName === props.columnName);
            const valIndex = props.cellEditor.columnView.columnNames.indexOf(props.cellEditor.linkReference.referencedColumnNames[colNameIndex]);
            console.log(value[valIndex])
            return value[valIndex];
        } else {
            return value;
        }
    }

    /**
     * When the input changes, send a filter request to the server
     * @param event - Event that gets fired on inputchange
     */
    const sendFilter = useCallback(async (value:any) => {
        props.context.contentStore.clearDataFromProvider(props.screenName, props.cellEditor.linkReference.referencedDataBook||"")
        const filterReq = createFilterRequest();
        filterReq.dataProvider = props.cellEditor.linkReference?.referencedDataBook;
        filterReq.editorComponentId = props.name;
        filterReq.value = value;

        if (props.isCellEditor) {
            filterReq.columnNames = [props.columnName]
        }

        if (props.onFilter) {
            props.onFilter(value);
        }
        
        await props.context.server.sendRequest(filterReq, REQUEST_KEYWORDS.FILTER).then(() => {
            if (!initialFilter) {
                setInitialFilter(true);
            }
        });
    }, [props.context.contentStore, props.context.server, props.cellEditor, props.name])

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
        event.stopPropagation();
        if((event as KeyboardEvent).key === "Enter") {
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
     * Handles the input, when the text is entered manually or via the dropdown menu and sends the value to the server
     * if the corresponding row is found in its databook. if it isn't, the state is set back to its previous value
     */
    const handleInput = (value?: string | string[]) => {
        const newVal: any = {}
        const linkReference = props.cellEditor.linkReference;

        let inputVal = value ? unpackValue(value) : text

        const refColNames = linkReference.referencedColumnNames;
        const colNames = linkReference.columnNames;
        const index = colNames.findIndex(col => col === props.columnName);

        /** Returns the values, of the databook, that match the input of the user */
        // check if providedData has an entry exact of inputVal
        let foundData = 
        providedData.some((data: any) => {
            if (linkReference.columnNames.length === 0 && linkReference.referencedColumnNames.length === 1 && props.cellEditor.displayReferencedColumnName) {
                if (data[props.cellEditor.displayReferencedColumnName]) {
                    return data[props.cellEditor.displayReferencedColumnName] === inputVal;
                }
                else {
                    return false;
                }
            }
            else {
                return data[refColNames[index]] === inputVal
            }
        }) ?
            // If yes get it
            providedData.find((data: any) => {
                if (linkReference.columnNames.length === 0 && linkReference.referencedColumnNames.length === 1 && props.cellEditor.displayReferencedColumnName) {
                    if (data[props.cellEditor.displayReferencedColumnName]) {
                        return data[props.cellEditor.displayReferencedColumnName] === inputVal;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    return data[refColNames[index]] === inputVal
                }
            }) :
            // If there is no exact value try to filter the providedData, if there is only one result it can still be used!
            providedData.filter((data: any) => {
                if (props.cellEditor) {
                    if (linkReference.columnNames.length === 0 && linkReference.referencedColumnNames.length === 1 && props.cellEditor.displayReferencedColumnName) {
                        if (data[props.cellEditor.displayReferencedColumnName]) {
                            if (typeof data[props.cellEditor.displayReferencedColumnName] !== "string") {
                                data[props.cellEditor.displayReferencedColumnName].toString().includes(inputVal);
                            }
                            else {
                                return data[props.cellEditor.displayReferencedColumnName].includes(inputVal);
                            }
                        }
                        else {
                            return false;
                        }
                    }
                    else {
                        if (data[refColNames[index]]) {
                            if (typeof data[refColNames[index]] !== "string") {
                                data[refColNames[index]].toString().includes(inputVal);
                            }
                            else {
                                return data[refColNames[index]].includes(inputVal);
                            }
                        }
                        else {
                            return false;
                        }
                    }

                }
                return false
            });

        foundData = Array.isArray(foundData) ? foundData : [foundData];

        const columnNames = (linkReference.columnNames.length === 0 && linkReference.referencedColumnNames.length === 1) ? props.columnName : linkReference.columnNames

        /** If the text is empty, send null to the server */
        if (!inputVal) {
            sendSetValues(props.dataRow, props.name, columnNames, null, props.context.server, lastValue.current, props.topbar, props.rowNumber);
        }
        /** If there is a match found send the value to the server */
        else if (foundData.length === 1) {
            if (props.cellEditor) {
                if (linkReference.columnNames.length > 1) {
                    /** 
                     * Columnnames in linkReference and foundData are not the same they need to be properly set to be sent to the server
                     * Example: linkReference.columnNames = ACTI_ID, ACTI_ACADEMIC_TITLE
                     *          foundData = ID, ACADEMIC_TITLE
                     * foundData columnNames have to be adjusted to linkReference
                     */
                    linkReference.referencedColumnNames.forEach((refCol, i) => newVal[linkReference.columnNames[i]] = foundData[0][refCol]);
                    if (newVal[props.columnName] === lastValue.current) {
                        setText(lastValue.current)
                    }
                    sendSetValues(props.dataRow, props.name, columnNames, newVal, props.context.server, lastValue.current, props.topbar, props.rowNumber);
                }
                /** If there is no more than 1 columnName in linkReference, text is enough */
                else {
                    if (props.cellEditor.displayReferencedColumnName) {
                        sendSetValues(props.dataRow, props.name, columnNames, foundData[0][linkReference.referencedColumnNames[0]], props.context.server, lastValue.current, props.topbar, props.rowNumber);
                        if (foundData[0][linkReference.referencedColumnNames[0]] === lastValue.current) {
                            setText(foundData[0][props.cellEditor.displayReferencedColumnName])
                        }
                    }
                    else {
                        sendSetValues(props.dataRow, props.name, columnNames, inputVal, props.context.server, lastValue.current, props.topbar, props.rowNumber);
                    }
                }

            }
        }
        /** If there is no match found set the old value */
        else {
            if (props.cellEditor.displayReferencedColumnName) {
                setText(lastDisplayValue.current);
            }
            else {
                setText(lastValue.current)
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
                let text : string | string[] = ""
                if (props.cellEditor) {
                    if (props.cellEditor.displayReferencedColumnName) {
                        text = value[props.cellEditor.displayReferencedColumnName];
                    }
                    else if(props.cellEditor.columnView?.columnCount > 1) {
                        text = props.cellEditor.columnView.columnNames.map(c => value[c]);
                    }
                    else {
                        const colNameIndex = props.cellEditor.linkReference.columnNames.findIndex(columnName => columnName === props.columnName);
                        text = value[props.cellEditor.linkReference.referencedColumnNames[colNameIndex]];
                    }
                } 
                suggestions.push(text)
            });
        }

        if(props.cellEditor.columnView?.columnCount > 1) {
            return [{
                label: props.cellEditor.columnView.columnNames,
                items: suggestions
            }]
        } else {
            return suggestions
        }
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
    const itemTemplate = useCallback((d, index) => {
        if (Array.isArray(d)) {
            return d.map((d, i) => {
                const cellStyle: CSSProperties = {}
                let icon:JSX.Element | null = null;

                if (providedData[index].__recordFormats && providedData[index].__recordFormats[props.name][i]) {
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
                                style={{width: `${iconData.size?.width}px`, height: `${iconData.size?.height}px` }} />
                            }
                        }
                        else {
                            icon = null;
                        }
                    }
                }

                return <div style={cellStyle} key={i}>{icon ?? d}</div>
            })
        } else {
            return d;
        }
    }, [providedData]);

    // Creates a header for the table when linked-overlay is in table-mode
    const groupedItemTemplate = useCallback(d => {
        return (d.label as string[]).map((d, i) => <div key={i}>{metaData?.columns[i]?.label ?? props.columnMetaData?.label ?? d}</div>)
    }, [props.columnMetaData, providedData, metaData]);

    return (
        <span 
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
                panelClassName={concatClassnames(
                    "rc-editor-linked-dropdown",
                    "dropdown-" + props.name, props.isCellEditor ? "dropdown-celleditor" : "", 
                    tableOptions ? "dropdown-table" : "",
                    linkedInput.current?.offsetWidth < 120 ? "linked-min-width" : ""
                )}
                scrollHeight={tableOptions ? ((providedData.length + 1) * 38) > 200 ? "200px" : `${(providedData.length + 1) * 38}px` : (providedData.length * 38) > 200 ? "200px" : `${providedData.length * 38}px`}
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
                onChange={event => setText(unpackValue(event.target.value))}
                onFocus={() => {
                    if (!focused.current) {
                        focused.current = true
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
                                focused.current = false
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

                    handleInput(event.value)
                }}
                tooltip={props.toolTipText}
                tooltipOptions={{ position: "left" }}
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