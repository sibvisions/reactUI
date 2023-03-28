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

import React, { createContext, FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Column } from "primereact/column";
import { DataTable, DataTableColumnResizeEndParams, DataTableSelectionChangeParams } from "primereact/datatable";
import _ from "underscore";
import BaseComponent from "../../util/types/BaseComponent";
import { createFetchRequest, createInsertRecordRequest, createSelectRowRequest, createSortRequest, createWidthRequest } from "../../factories/RequestFactory";
import { showTopBar } from "../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../../util/server-util/SendFocusRequests";
import { IToolBarPanel } from "../panels/toolbarPanel/UIToolBarPanel";
import { VirtualScrollerLazyParams } from "primereact/virtualscroller";
import { DomHandler } from "primereact/utils";
import CELLEDITOR_CLASSNAMES from "../editors/CELLEDITOR_CLASSNAMES";
import MetaDataResponse from "../../response/data/MetaDataResponse";
import useComponentConstants from "../../hooks/components-hooks/useComponentConstants";
import useMetaData from "../../hooks/data-hooks/useMetaData";
import useDataProviderData from "../../hooks/data-hooks/useDataProviderData";
import useSortDefinitions from "../../hooks/data-hooks/useSortDefinitions";
import useRowSelect from "../../hooks/data-hooks/useRowSelect";
import { SortDefinition } from "../../request/data/SortRequest";
import useFetchMissingData from "../../hooks/data-hooks/useFetchMissingData";
import useMouseListener from "../../hooks/event-hooks/useMouseListener";
import { SelectFilter } from "../../request/data/SelectRowRequest";
import REQUEST_KEYWORDS from "../../request/REQUEST_KEYWORDS";
import { sendOnLoadCallback } from "../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../util/component-util/SizeUtil";
import { getFocusComponent } from "../../util/html-util/GetFocusComponent";
import { CellEditor } from "./CellEditor";
import { concatClassnames } from "../../util/string-util/ConcatClassnames";
import useMultipleEventHandler from "../../hooks/event-hooks/useMultipleEventHandler";
import { getTabIndex } from "../../util/component-util/GetTabIndex";

import usePopupMenu from "../../hooks/data-hooks/usePopupMenu";
import Dimension from "../../util/types/Dimension";
import { IExtendableTable } from "../../extend-components/table/ExtendTable";
import { ICellEditorLinked } from "../editors/linked/UIEditorLinked";
import useDesignerUpdates from "../../hooks/style-hooks/useDesignerUpdates";
import useHandleDesignerUpdate from "../../hooks/style-hooks/useHandleDesignerUpdate";


/** Interface for Table */
export interface TableProps extends BaseComponent {
    classNameComponentRef: string,
    columnLabels: Array<string>,
    columnNames: Array<string>,
    dataBook: string,
    tableHeaderVisible?: boolean
    autoResize?: boolean,
    enterNavigationMode?: number,
    tabNavigationMode?: number,
    startEditing?: boolean,
    editable?: boolean,
    showFocusRect?:boolean,
    showSelection?:boolean
    sortOnHeaderEnabled?:boolean
}

enum Navigation {
    NAVIGATION_NONE = 0,
    NAVIGATION_CELL_AND_FOCUS = 1,
    NAVIGATION_CELL_AND_ROW_AND_FOCUS = 2,
    NAVIGATION_ROW_AND_FOCUS = 3
}

enum CellVisibility {
    FULL_VISIBLE = 2,
    PART_VISIBLE = 1,
    NOT_VISIBLE = 0
}

/** Interface for selected cells */
interface ISelectedCell {
    selectedCellId?:string
}

/** A Context which contains the currently selected cell */
export const SelectedCellContext = createContext<ISelectedCell>({});

/** Returns the columnMetaData */
export const getColMetaData = (colName:string, metaData?:MetaDataResponse) => {
    return metaData?.columns.find(column => column.name === colName);
}

/**
 * Returns the next sort mode
 * @param mode - the current sort mode
 * @returns the next sort mode
 */
function getNextSort(mode?: "Ascending" | "Descending" | "None") {
    if (mode === "Ascending") {
        return "Descending";
    }
    else if (mode === "Descending") {
        return "None";
    }
    else {
        return "Ascending";
    }
}

/**
 * Helper function to see if the next element in a container is fully or partly visible
 * @param ele - the element which needs to be checked
 * @param container - the container of the element
 * @param cell  - the current cell
 * @returns if the element is fully or partly visible
 */
function isVisible(ele:HTMLElement, container:HTMLElement, cell:any, rowHeight:number) {
    if (ele) {
        const eleLeft = ele.offsetLeft;
        const eleRight = eleLeft + ele.clientWidth;
    
        const containerLeft = container.scrollLeft;
        const containerRight = containerLeft + container.clientWidth;

        const eleTop = cell.rowIndex * rowHeight;
        const eleBottom = eleTop + ele.clientHeight;
    
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;

        let visLeft:CellVisibility = CellVisibility.NOT_VISIBLE;
        let visTop:CellVisibility = CellVisibility.NOT_VISIBLE;

        if (eleLeft >= containerLeft && eleRight <= containerRight) {
            visLeft = CellVisibility.FULL_VISIBLE;
        }
        if ((eleLeft < containerLeft && containerLeft < eleRight) || (eleLeft < containerRight && containerRight < eleRight)) {
            visLeft = CellVisibility.PART_VISIBLE;
        }

        if (eleTop >= containerTop && eleBottom <= containerBottom) {
            visTop = CellVisibility.FULL_VISIBLE;
        }
        if ((eleTop < containerTop && containerTop < eleBottom) ||(eleTop < containerBottom && containerBottom < eleBottom)) {
            visTop = CellVisibility.PART_VISIBLE;
        }
    
        // The element is fully visible in the container
        return {visLeft: visLeft, visTop: visTop}
    }
    else {
        return {visLeft: CellVisibility.NOT_VISIBLE, visTop: CellVisibility.NOT_VISIBLE}
    }
};



/**
 * This component displays a DataTable
 * @param baseProps - Initial properties sent by the server for this component
 */
const UITable: FC<TableProps & IExtendableTable> = (baseProps) => {
    /** Reference for the div wrapping the Table */
    const wrapRef = useRef<HTMLDivElement>(null);

    /** Reference for the Table */
    const tableRef = useRef<DataTable>(null);

    /** Component constants */
    const [context, topbar, [props], layoutStyle, compStyle, styleClassNames] = useComponentConstants<TableProps & IExtendableTable>(baseProps);

    /** Name of the screen */
    const screenName = useMemo(() => context.contentStore.getScreenName(props.id, props.dataBook) as string, [context.contentStore, props.id, props.dataBook]);

    /** Metadata of the databook */
    const metaData = useMetaData(screenName, props.dataBook, undefined);

    /** The data provided by the databook */
    const [providerData] = useDataProviderData(screenName, props.dataBook);

    const designerUpdate = useDesignerUpdates('table');

    /**
     * Get the set data-height, with the designer it's not possible to set lower than 16px (nothing will change below).
     * So set it to a minimum of 16 and add the usual 8 which is set by borders and padding.
     */
    const tableRowHeight = useMemo(() => {
        let rowHeight = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue("--table-data-height"))
        if (rowHeight < 16) {
            return 24;
        }
        else {
            return rowHeight + 8;
        }
    }, [designerUpdate])

    /**
     * Returns the number of records visible based on row height.
     * @returns the number of records visible based on row height.
     */
     const getNumberOfRowsPerPage = useCallback(() => {
        let headerHeight = 40;
        const table = tableRef.current as any;
        if (table && table.table) {
            headerHeight = table.table.querySelector('.p-datatable-thead').offsetHeight;
        }

        return Math.floor((layoutStyle?.height as number - headerHeight) / tableRowHeight)
    }, [layoutStyle?.height, designerUpdate, tableRowHeight])

    /** The amount of virtual rows loaded */
    const rows = useMemo(() => {
        if (metaData && props.columnNames.length > 20) {
            if (getNumberOfRowsPerPage()) {
                return getNumberOfRowsPerPage() + 3;
            }
            else {
                return 5;
            }
        }
        return 40;
    }, [props.columnNames.length, getNumberOfRowsPerPage])

    /** Virtual scrolling is enabled (lazy loading), if the provided data is greater than 2 times the row value*/
    const virtualEnabled = useMemo(() => {
        return providerData.length > rows * 2;
    }, [providerData.length, rows]);

    /** The virtual rows filled with data */
    const [virtualRows, setVirtualRows] = useState<any[]>((() => { 
        const out = Array.from({ length: providerData.length });
        out.splice(0, rows, ...providerData.slice(0, rows)); 
        return out;
    })());

    /** the list row height */
    const [itemSize, setItemSize] = useState(tableRowHeight);

    /** The current firstRow displayed in the table */
    const firstRowIndex = useRef(0);

    /** The current sort-definitions */
    const [sortDefinitions] = useSortDefinitions(screenName, props.dataBook);

    /** The current order of the columns */
    const [columnOrder, setColumnOrder] = useState<string[]|undefined>(props.columnNames);

    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(screenName, props.dataBook);

    /** Reference if the page up/down key was pressed */
    const pageKeyPressed = useRef<boolean>(false);

    /** Reference of the last selected row used for scrolling */
    const lastSelectedRowIndex = useRef<number|undefined>(selectedRow ? selectedRow.index : undefined);

    const focusIsClicked = useRef<boolean>(false);

    /** True, if virtualscrolling is loading */
    const [listLoading, setListLoading] = useState(false);

    const rowSelectionHelper = useRef<{data: any, selectedColumn: string, index: number, filter: any, event: DataTableSelectionChangeParams}>()

    // Cache for the sort-definitions
    const sortDefinitionCache = useRef<SortDefinition[]>();

    /** The primary keys of a table */
    const primaryKeys:string[] = useMemo(() => {
        if (metaData) {
            if (metaData.primaryKeyColumns) {
                return metaData.primaryKeyColumns;
            }
            else {
                return metaData.columns.map(col => col.name);
            }
        }
        else {
            return []
        }
    }, [metaData]);

    /** The selected cell */
    const [selectedCellId, setSelectedCellId] = useState<ISelectedCell>({selectedCellId: "notSet"});

    /** A counter which indicates how many linkedReference still need to be fetched (concatmask). Used for column width measurement */
    const linkedRefFetchList = useRef<string[]>([]);

    const [measureFlag, setMeasureFlag] = useState<boolean>(false);

    // Fetches Data if dataprovider has not been fetched yet
    useFetchMissingData(screenName, props.dataBook);

    const [isSelecting, setIsSelecting] = useState<boolean>(false);

    const clickedResizer = useRef<boolean>(false);

    const heldMouseEvents = useRef<Set<Function>>(new Set());
    /** Hook for MouseListener */
    useMouseListener(
        props.name, 
        tableRef.current ? (tableRef.current as any).el.querySelector(".p-datatable-tbody") : undefined, 
        props.eventMouseClicked, 
        props.eventMousePressed, 
        props.eventMouseReleased,
        (type, release) => {
            heldMouseEvents.current.add(release);
            if (type === "clicked" || type === "cancelled") {
                setTimeout(() => {
                    heldMouseEvents.current.forEach(release => release());
                    heldMouseEvents.current.clear();
                }, 1)
            }
        },
        true,
        () => {
            if (rowSelectionHelper.current) {
                if (props.onRowSelect) {
                    props.onRowSelect({ originalEvent: rowSelectionHelper.current.event, selectedRow: rowSelectionHelper.current.data })
                }
                if (selectedRow.index !== rowSelectionHelper.current.index) {
                    setIsSelecting(true);
                }
                sendSelectRequest(rowSelectionHelper.current.selectedColumn, rowSelectionHelper.current.filter, rowSelectionHelper.current.index).then(() => {
                    setIsSelecting(false);
                    rowSelectionHelper.current = undefined;
                });
            }
        }
    );

    /**
     * Sends a selectRequest to the server, if a new row is selected selectRow, else selectColumn
     * @param selectedColumn - the selected column
     * @param filter - if a new row is selected, the filter to send to the server
     */
    const sendSelectRequest = useCallback(async (selectedColumn:string|undefined, filter:SelectFilter|undefined, rowIndex:number) => {
        const selectReq = createSelectRowRequest();
        selectReq.dataProvider = props.dataBook;
        selectReq.componentId = props.name;
        selectReq.rowNumber = rowIndex;
        if (selectedColumn) selectReq.selectedColumn = selectedColumn;
        if (filter) selectReq.filter = filter;
        //await showTopBar(context.server.sendRequest(selectReq, filter ? REQUEST_KEYWORDS.SELECT_ROW : REQUEST_KEYWORDS.SELECT_COLUMN, undefined, undefined, true, RequestQueueMode.IMMEDIATE), topbar);
        await showTopBar(context.server.sendRequest(selectReq, filter ? REQUEST_KEYWORDS.SELECT_ROW : REQUEST_KEYWORDS.SELECT_COLUMN, undefined, undefined, true), topbar);
    }, [props.dataBook, props.name, context.server])



    /**
     * Scrolls the table to the selected cell
     * @param cell - the selected cell
     * @param isNext - if the new selected cell is below or above the previous
     */
    const scrollToSelectedCell = (cell:any, isNext:boolean) => {
        setTimeout(() => {
            if (tableRef.current) {
                //@ts-ignore
                const table = tableRef.current.el
                const selectedElem = DomHandler.findSingle(table, 'tbody > tr.p-highlight td.p-highlight');
                const container = DomHandler.findSingle(table, !virtualEnabled ? '.p-datatable-wrapper' : '.p-virtualscroller');
                const loadingTable = DomHandler.findSingle(table, '.p-datatable-loading-virtual-table')

                if (!loadingTable || window.getComputedStyle(loadingTable).getPropertyValue("display") !== "table") {
                    const moveDirections = isVisible(selectedElem, container, cell, tableRowHeight);
                    if (pageKeyPressed.current !== false) {
                        pageKeyPressed.current = false;
                        container.scrollTo(selectedElem ? selectedElem.offsetLeft : 0, cell.rowIndex * tableRowHeight);
                        container.focus();
                    }
                    else if (selectedElem !== null) {
                        let sLeft:number = container.scrollLeft
                        let sTop:number = container.scrollTop
    
                        if (moveDirections.visLeft !== CellVisibility.FULL_VISIBLE) {
                            sLeft = selectedElem.offsetLeft;
                        }
    
                        if (moveDirections.visTop === CellVisibility.NOT_VISIBLE) {
                            sTop = cell.rowIndex * tableRowHeight;
                        }
                        else if (moveDirections.visTop === CellVisibility.PART_VISIBLE) {
                            sTop = container.scrollTop + (isNext ? tableRowHeight : -tableRowHeight);
                        }
                        container.scrollTo(sLeft, sTop);
                    }
                    else {
                        container.scrollTo(container.scrollLeft, cell.rowIndex * tableRowHeight);
                    }
                }
            }
        }, 0)
    }

    /** Creates and returns the selectedCell object */
    const selectedCell = useMemo(() => {
        if (selectedRow && selectedRow.data && columnOrder) {
            if (selectedRow.selectedColumn) {
                const newCell = {
                    cellIndex: columnOrder.findIndex(column => column === selectedRow.selectedColumn),
                    field: selectedRow.selectedColumn,
                    rowData: selectedRow.data,
                    rowIndex: selectedRow.index,
                    value: selectedRow.data[selectedRow.selectedColumn]
                }
                setSelectedCellId({selectedCellId: props.id + "-" + newCell.rowIndex!.toString() + "-" + newCell.cellIndex.toString()});
                if (selectedRow && (lastSelectedRowIndex.current !== selectedRow.index || lastSelectedRowIndex.current === undefined)) {
                    scrollToSelectedCell(newCell, lastSelectedRowIndex.current !== undefined ? lastSelectedRowIndex.current < selectedRow.index : false);
                }    
                lastSelectedRowIndex.current = selectedRow.index;
                return newCell
            }
            else {
                sendSelectRequest(columnOrder[0], undefined, 0);
            }
        }
        return undefined
    }, [selectedRow, columnOrder]);

    /** The estimated table width */
    const [estTableWidth, setEstTableWidth] = useState(0);

    const [isEditing, setIsEditing] = useState<boolean>(false);

    /** The navigation-mode for the enter key sent by the server default: cell and focus */
    const enterNavigationMode = props.enterNavigationMode || Navigation.NAVIGATION_CELL_AND_FOCUS;

    /** The navigation-mode for the tab key sent by the server default: cell and focus */
    const tabNavigationMode = props.tabNavigationMode || Navigation.NAVIGATION_CELL_AND_FOCUS;

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps

    //Returns navtable classname
    const getNavTableClassName = (parent?:string) => {
        if (parent) {
            const parentProps = context.contentStore.getComponentById(parent);
            if (parentProps?.className === "ToolBarPanel" && (parentProps as IToolBarPanel).toolBarVisible !== false) {
                switch((parentProps as IToolBarPanel).toolBarArea) {
                    case 0:
                        return "navtable-north";
                    case 1:
                        return "navtable-west";
                    case 2:
                        return "navtable-south";
                    case 3:
                        return "navtable-east";
                    default:
                        return "navtable-west";
                }
            }
        }
        return ""
    }

    useEffect(() => {
        setItemSize(tableRowHeight);
    }, [tableRowHeight])

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useEffect(() => {
        if(wrapRef.current){
            if(onLoadCallback) {
                if (props.preferredSize) {
                    sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback)
                }
                else {
                    const getTableHeight = () => {
                        if (providerData.length > 10) {
                            return 410;
                        }
                        else {
                            let height = props.tableHeaderVisible !== false ? 42 : 4
                            if (providerData.length === 0) {
                                height += 50;
                            }
                            else {
                                height += providerData.length * tableRowHeight
                            }

                            if (layoutStyle && (estTableWidth + 4) > (layoutStyle!.width as number)) {
                                height += 17;
                            }
                            return height
                        }

                    }
                    /** If the provided data is more than 10, send a fixed height if less, calculate the height */
                    const prefSize:Dimension = {height: getTableHeight(), width: estTableWidth + 4}
                    sendOnLoadCallback(id, props.className, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize) ? parseMinSize(props.minimumSize) : { width: 0, height: 0 }, undefined, onLoadCallback)
                }  
            }    
        }
    }, [id, onLoadCallback, props.preferredSize, props.maximumSize, props.minimumSize, estTableWidth, props.tableHeaderVisible, providerData]);

    useHandleDesignerUpdate(
        designerUpdate,
        wrapRef.current,
        layoutStyle,
        (clone: HTMLElement) => sendOnLoadCallback(
            id,
            props.className,
            parsePrefSize(props.preferredSize),
            parseMaxSize(props.maximumSize),
            parseMinSize(props.minimumSize),
            clone,
            onLoadCallback
        ),
        onLoadCallback
    );

    /** Determine the estimated width of the table */
    useLayoutEffect(() => {
        if (tableRef.current) {
            let cellDataWidthList: Array<{ widthPreSet: boolean, width: number }> = [];
            /** Goes through the rows and their cellData and sets the widest value for each column in a list */
            const goThroughCellData = (trows: any, index: number) => {
                const cellDatas: NodeListOf<HTMLElement> = trows[index].querySelectorAll("td > *:not(.p-column-title)");
                for (let j = 0; j < cellDatas.length; j++) {
                    if (!cellDataWidthList[j].widthPreSet) {
                        let tempWidth: number;
                        if (cellDatas[j] !== undefined) {
                            /** If it is a Linked- or DateCellEditor add 70 pixel to its measured width to display the editor properly*/
                            if (cellDatas[j].parentElement?.classList.contains('LinkedCellEditor') || cellDatas[j].parentElement?.classList.contains('DateCellEditor')) {
                                tempWidth = (cellDatas[j].querySelector(".cell-data-content") as HTMLElement).offsetWidth + 30;
                            }
                            else if (cellDatas[j].parentElement?.classList.contains('ChoiceCellEditor') || cellDatas[j].parentElement?.classList.contains('CheckBoxCellEditor')) {
                                tempWidth = 24;
                            }
                            else {
                                tempWidth = (cellDatas[j].querySelector(".cell-data-content") as HTMLElement).offsetWidth;
                            }

                            /** If the measured width is greater than the current widest width for the column, replace it */
                            if (tempWidth > cellDataWidthList[j].width) {
                                cellDataWidthList[j].width = tempWidth;
                            }
                        }
                    }
                }
            }
            setTimeout(() => {
                const table = tableRef.current as any;
                //@ts-ignore
                const currentTable:HTMLTableElement = tableRef?.current?.table;
                if (currentTable) {
                    const theader = currentTable.querySelectorAll('th');
                    const trows = currentTable.querySelectorAll('tbody > tr');

                    table.destroyStyleElement();

                    /** First set width of headers for columns then rows */
                    for (let i = 0; i < theader.length; i++) {
                        theader[i].style.removeProperty('width')
                        const newCellWidth = { widthPreSet: false, width: 0 }
                        const colName = window.getComputedStyle(theader[i]).getPropertyValue('--columnName');
                        const columnMetaData = getColMetaData(colName, metaData);
                        if (columnMetaData?.width) {
                            newCellWidth.width = columnMetaData.width;
                            newCellWidth.widthPreSet = true;
                            theader[i].setAttribute('column-width-set', "true");
                        }
                        else {
                            const title = theader[i].querySelector('.p-column-title');
                            newCellWidth.width = title ? (title.getBoundingClientRect().width + 34) : 0;
                        }
                        cellDataWidthList.push(newCellWidth);
                    }
                    // adding "read-size" sets the table to table-layout auto and the td's to display inline block to correctly measure the width
                    (tableRef.current as any).el.classList.add("read-size");
                    for (let i = 0; i < Math.min(trows.length, 10); i++) {
                        goThroughCellData(trows, i);
                    }
                    (tableRef.current as any).el.classList.remove("read-size");

                    let tempWidth: number = 0;
                    cellDataWidthList.forEach(cellDataWidth => {
                        tempWidth += cellDataWidth.width
                    });

                    /** After finding the correct width set the width for the headers, the rows will get as wide as headers */
                    for (let i = 0; i < theader.length; i++) {
                        let w = cellDataWidthList[i].width as any;
                        if (props.autoResize === false) {
                            w = `${w}px`;
                        } else {
                            w = `${100 * w / tempWidth}%`;
                        }
                        theader[i].style.setProperty('width', w);
                    }
                    /** set EstTableWidth for size reporting */
                    setEstTableWidth(tempWidth);
                }
                else {
                    setEstTableWidth(0);
                }
            }, 0);
        }
    }, [metaData?.columns, measureFlag]);

    // Disable resizable cells on non resizable, set column order of table
    useLayoutEffect(() => {
        if (tableRef.current) {
            //@ts-ignore
            const colResizers = tableRef.current.el.getElementsByClassName("p-column-resizer");
            for (const colResizer of colResizers) {
                if (!colResizer.parentElement.classList.contains("cell-not-resizable") && colResizer.style.display === "none") {
                    colResizer.style.setProperty("display", "block");
                }
                if (colResizer.parentElement.classList.contains("cell-not-resizable")) {
                    colResizer.style.setProperty("display", "none");
                }
            }
        }

        setColumnOrder(props.columnNames)
    },[metaData])

    /** When providerData changes set state of virtual rows*/
    useLayoutEffect(() => {
        setVirtualRows((() => { 
            const out = Array.from({ length: providerData.length });
            out.splice(firstRowIndex.current, rows, ...providerData.slice(firstRowIndex.current, firstRowIndex.current + rows));
            return out;
        })());
    }, [providerData, rows]);

    // Adds and removes the sort classnames to the headers for styling
    // If the lib user extends the Table with onSort, call it when the user sorts.
    useEffect(() => {
        if (tableRef.current) {
            if (props.onSort) {
                props.onSort(sortDefinitions);
            }

            const table = tableRef.current as any;
            const allTableColumns = DomHandler.find(table.table, '.p-datatable-thead > tr > th');
            if (sortDefinitions && sortDefinitions.length) {
                sortDefinitions.forEach(sort => {
                    const el = allTableColumns.find(col => col.classList.contains(sort.columnName));
                    if (el) {
                        const sortIcon = el.querySelector('.p-sortable-column-icon');
                        el.classList.remove("sort-asc", "sort-des");
                        sortIcon.classList.remove("pi-sort-amount-up-alt", "pi-sort-amount-down");
                        if (sort.mode === "Ascending") {
                            el.classList.add("sort-asc");
                            sortIcon.classList.add("pi-sort-amount-up-alt");
                        }
                        else if (sort.mode === "Descending") {
                            el.classList.add("sort-des");
                            sortIcon.classList.add("pi-sort-amount-down");
                        }
                    }

                });
            }

            if (sortDefinitionCache.current && sortDefinitionCache.current.length && sortDefinitions) {
                sortDefinitionCache.current?.forEach(sort => {
                    const foundSort = sortDefinitions.findIndex(sortDef => sortDef.columnName === sort.columnName);

                    if (foundSort === -1) {
                        const el = allTableColumns.find(col => col.classList.contains(sort.columnName));

                        if (el) {
                            const sortIcon = el.querySelector('.p-sortable-column-icon');
                            el.classList.remove("sort-asc", "sort-des");
                            sortIcon.classList.remove("pi-sort-amount-up-alt", "pi-sort-amount-down");
                        }
                    }
                })
            }

            sortDefinitionCache.current = sortDefinitions;
        }
    }, [sortDefinitions]);

    /**
     * Selects the next cell, if there is no cell anymore and delegateFocus is true, focus the next component
     * @param delegateFocus - true if the next component should be focused if there are no more cells
     */
    const selectNextCell = useCallback((delegateFocus:boolean) => {
        if (selectedRow !== undefined && columnOrder) {
            const newSelectedColumnIndex = columnOrder.findIndex(column => column === selectedRow.selectedColumn) + 1;
            if (newSelectedColumnIndex < columnOrder.length) {
                const newSelectedColumn = columnOrder[newSelectedColumnIndex];
                sendSelectRequest(newSelectedColumn, undefined, selectedRow.index);
                return true;
            }
            else if (delegateFocus) {
                getFocusComponent(props.name + "-wrapper", true)?.focus();
                return false;
            }
        }
        else if (delegateFocus) {
            getFocusComponent(props.name + "-wrapper", true)?.focus();
            return false;
        }
    }, [selectedRow, columnOrder, sendSelectRequest])

    /**
     * Selects the previous cell, if there is no cell anymore and delegateFocus is true, focus the previous component
     * @param delegateFocus - true if the previous component should be focused if there are no more cells
     */
    const selectPreviousCell = useCallback((delegateFocus:boolean) => {
        if (selectedRow !== undefined && columnOrder) {
            const newSelectedColumnIndex = columnOrder.findIndex(column => column === selectedRow.selectedColumn) - 1;
            if (newSelectedColumnIndex >= 0) {
                const newSelectedColumn = columnOrder[newSelectedColumnIndex];
                sendSelectRequest(newSelectedColumn, undefined, selectedRow.index);
                return true;
            }
            else if (delegateFocus) {
                getFocusComponent(props.name + "-wrapper", false)?.focus();
                return false;
            }
        }
        else if (delegateFocus) {
            getFocusComponent(props.name + "-wrapper", false)?.focus();
            return false;
        }
    }, [selectedRow, columnOrder, sendSelectRequest])

    /**
     * Selects the next row, if there is no row anymore and delegateFocus is true, focus the next component
     * @param delegateFocus - true if the next component should be focused if there are no more rows
     */
    const selectNextRow = useCallback((delegateFocus:boolean) => {
        if (selectedRow !== undefined) {
            const nextSelectedRowIndex = selectedRow.index + 1;
            if (nextSelectedRowIndex < providerData.length) {
                let filter:SelectFilter = {
                    columnNames: primaryKeys,
                    values: primaryKeys.map(pk => providerData[nextSelectedRowIndex][pk])
                };
                sendSelectRequest(undefined, filter, nextSelectedRowIndex);
                return true;
            }
            else if (delegateFocus) {
                getFocusComponent(props.name + "-wrapper", true)?.focus();
                return false;
            }
        }
        else if (delegateFocus) {
            getFocusComponent(props.name + "-wrapper", true)?.focus();
            return false;
        }
    }, [selectedRow, primaryKeys, providerData, sendSelectRequest])

    /**
     * Selects the previous row, if there is no row anymore and delegateFocus is true, focus the previous component
     * @param delegateFocus - true if the previous component should be focused if there are no more rows
     */
    const selectPreviousRow = useCallback((delegateFocus:boolean) => {
        if (selectedRow !== undefined) {
            const prevSelectedRowIndex = selectedRow.index - 1;
            if (prevSelectedRowIndex >= 0) {
                let filter:SelectFilter = {
                    columnNames: primaryKeys,
                    values: primaryKeys.map(pk => providerData[prevSelectedRowIndex][pk])
                };
                sendSelectRequest(undefined, filter, prevSelectedRowIndex);
                return true;
            }
            else if (delegateFocus) {
                getFocusComponent(props.name + "-wrapper", false)?.focus();
                return false;
            }
        }
        else if (delegateFocus) {
            getFocusComponent(props.name + "-wrapper", false)?.focus();
            return false;
        }
    }, [selectedRow, primaryKeys, providerData, sendSelectRequest])

    /**
     * Selects the next cell, if there is no cell anymore select the next row and so on. If there is no more cells/rows and delegateFocus is true, focus the next component
     * @param delegateFocus - true if the next component should be focused if there are no more cells/rows
     */
    const selectNextCellAndRow = useCallback((delegateFocus:boolean) => {
        if (selectedRow !== undefined && columnOrder) {
            const newSelectedColumnIndex = columnOrder.findIndex(column => column === selectedRow.selectedColumn) + 1;
            const nextSelectedRowIndex = selectedRow.index + 1;
            if (newSelectedColumnIndex < columnOrder.length) {
                const newSelectedColumn = columnOrder[newSelectedColumnIndex];
                sendSelectRequest(newSelectedColumn, undefined, selectedRow.index);
                return true;
            }
            else if (nextSelectedRowIndex < providerData.length) {
                let filter:SelectFilter = {
                    columnNames: primaryKeys,
                    values: primaryKeys.map(pk => providerData[nextSelectedRowIndex][pk])
                };
                sendSelectRequest(columnOrder[0], filter, nextSelectedRowIndex);
                return true;
            }
            else if (delegateFocus) {
                getFocusComponent(props.name + "-wrapper", true)?.focus();
                return false;
            }
        }
        else if (delegateFocus) {
            getFocusComponent(props.name + "-wrapper", true)?.focus();
            return false;
        }
    }, [selectedRow, primaryKeys, columnOrder, providerData, sendSelectRequest])

    /**
     * Selects the previous cell, if there is no cell anymore select the previous row and so on. If there is no more cells/rows and delegateFocus is true, focus the next component
     * @param delegateFocus - true if the previous component should be focused if there are no more cells/rows
     */
    const selectPreviousCellAndRow = useCallback((delegateFocus:boolean) => {
        if (selectedRow !== undefined && columnOrder) {
            const prevSelectedColumnIndex = columnOrder.findIndex(column => column === selectedRow.selectedColumn) - 1;
            const prevSelectedRowIndex = selectedRow.index - 1;
            if (prevSelectedColumnIndex >= 0) {
                const newSelectedColumn = columnOrder[prevSelectedColumnIndex];
                sendSelectRequest(newSelectedColumn, undefined, selectedRow.index);
                return true;
            }
            else if (prevSelectedRowIndex >= 0) {
                let filter:SelectFilter = {
                    columnNames: primaryKeys,
                    values: primaryKeys.map(pk => providerData[prevSelectedRowIndex][pk])
                };
                sendSelectRequest(columnOrder[columnOrder.length - 1], filter, prevSelectedRowIndex);
                return true;
            }
            else if (delegateFocus) {
                getFocusComponent(props.name + "-wrapper", false)?.focus();
                return false;
            }
        }
        else if (delegateFocus) {
            getFocusComponent(props.name + "-wrapper", false)?.focus();
            return false;
        }
    }, [selectedRow, primaryKeys, columnOrder, providerData, sendSelectRequest])

    /** 
     * Selects a row which is further down based on the height of the table if there are no more rows and delegate Focus is true, focus the next component
     * @param delegateFocus - true if the next component should be focused if there are no more rows
     */
    const selectNextPage = (delegateFocus: boolean) => {
        if (selectedRow) {
            let nextSelectedRowIndex = selectedRow.index;
            if (nextSelectedRowIndex < providerData.length - 1) {
                nextSelectedRowIndex += getNumberOfRowsPerPage();
                if (nextSelectedRowIndex >= providerData.length) {
                    nextSelectedRowIndex = providerData.length - 1;
                }
                let filter: SelectFilter = {
                    columnNames: primaryKeys,
                    values: primaryKeys.map(pk => providerData[nextSelectedRowIndex][pk])
                };
                sendSelectRequest(undefined, filter, nextSelectedRowIndex);
                return true;
            }
            else if (delegateFocus) {
                getFocusComponent(props.name + "-wrapper", true)?.focus();
                return false;
            }
        }
    }

    /** 
     * Selects a row which is further up based on the height of the table if there are no more rows and delegate Focus is true, focus the previous component
     * @param delegateFocus - true if the previous component should be focused if there are no more rows
     */
    const selectPreviousPage = (delegateFocus: boolean) => {
        if (selectedRow) {
            let nextSelectedRowIndex = selectedRow.index;
            if (nextSelectedRowIndex > 0) {
                nextSelectedRowIndex -= getNumberOfRowsPerPage();
                if (nextSelectedRowIndex < 0) {
                    nextSelectedRowIndex = 0;
                }
                let filter: SelectFilter = {
                    columnNames: primaryKeys,
                    values: primaryKeys.map(pk => providerData[nextSelectedRowIndex][pk])
                };
                sendSelectRequest(undefined, filter, nextSelectedRowIndex);
                return true;
            }
            else if (delegateFocus) {
                getFocusComponent(props.name + "-wrapper", false)?.focus();
                return false;
            }
        }
    }

    /**
     * Chooses which next select function should be used based on the navigation mode
     */
    const selectNext = useRef<Function>();
    useEffect(() => {
        selectNext.current = (navigationMode:number) => {
            if (navigationMode === Navigation.NAVIGATION_CELL_AND_FOCUS) {
                return selectNextCell(true);
            }
            else if (navigationMode === Navigation.NAVIGATION_ROW_AND_FOCUS) {
                selectNextRow(true);
            }
            else if (navigationMode === Navigation.NAVIGATION_CELL_AND_ROW_AND_FOCUS) {
                selectNextCellAndRow(true);
            }
        }
    }, [selectNextCell, selectNextRow, selectNextCellAndRow]);

    /**
     * Chooses which previous select function should be used based on the navigation mode
     */
    const selectPrevious = useRef<Function>();
    useEffect(() => {   
        selectPrevious.current = (navigationMode:number, row?:any) => {
            if (navigationMode === Navigation.NAVIGATION_CELL_AND_FOCUS) {
                selectPreviousCell(true);
            }
            else if (navigationMode === Navigation.NAVIGATION_ROW_AND_FOCUS) {
                selectPreviousRow(true);
            }
            else if (navigationMode === Navigation.NAVIGATION_CELL_AND_ROW_AND_FOCUS) {
                selectPreviousCellAndRow(true)
            }
        }
    }, [selectPreviousCell, selectPreviousRow, selectPreviousCellAndRow])

    /** Building the columns */
    const columns = useMemo(() => {
        const createColumnHeader = (colName: string, colIndex: number) => {
            let sortIndex = ""
            if (sortDefinitions && sortDefinitions.length) {
                let foundIndex = sortDefinitions.findIndex(sortDef => sortDef.columnName === colName);
                if (foundIndex >= 0) {
                    sortIndex = (foundIndex + 1).toString();
                }
            }
            return (
                <>
                    <span onClick={() => handleSort(colName)} dangerouslySetInnerHTML={{ __html: props.columnLabels[colIndex] + (getColMetaData(colName, metaData)?.nullable ? "" : " *") }} /> 
                    <span onClick={() => handleSort(colName)} className="p-sortable-column-icon pi pi-fw"></span>
                    <span style={{ display: sortIndex ? "inline-block" : "none" }} className="sort-index" onClick={() => handleSort(colName)}>{sortIndex}</span>
                </>)
        }

        return props.columnNames.map((colName, colIndex) => {
            const columnMetaData = getColMetaData(colName, metaData);
            const className = columnMetaData?.cellEditor?.className;
            if (columnMetaData?.cellEditor.className === CELLEDITOR_CLASSNAMES.LINKED 
                && (columnMetaData.cellEditor as ICellEditorLinked).displayConcatMask 
                && !linkedRefFetchList.current.includes((columnMetaData.cellEditor as ICellEditorLinked).linkReference.referencedDataBook)) {
                    linkedRefFetchList.current.push((columnMetaData.cellEditor as ICellEditorLinked).linkReference.referencedDataBook);
            }
            return <Column
                field={colName}
                header={createColumnHeader(colName, colIndex)}
                key={colName}
                headerClassName={concatClassnames(colName, (props.columnLabels[colIndex] === "☐" || props.columnLabels[colIndex] === "☑") ? 'select-column' : "") }
                headerStyle={{
                    overflowX: "hidden",
                    whiteSpace: 'nowrap',
                    textOverflow: 'Ellipsis',
                    display: props.tableHeaderVisible === false ? 'none' : undefined,
                    '--columnName': colName
                }}
                body={(rowData: any, tableInfo: any) => {
                    if (!rowData) { return <div></div> }
                    return <CellEditor
                        rowData={rowData}
                        pk={_.pick(rowData, primaryKeys)}
                        screenName={screenName}
                        name={props.name as string}
                        colName={colName}
                        dataProvider={props.dataBook}
                        cellData={rowData[colName]}
                        cellFormatting={rowData.__recordFormats && rowData.__recordFormats[props.name]}
                        resource={context.server.RESOURCE_URL}
                        cellId={() => ({
                            selectedCellId: props.id + "-" + tableInfo.rowIndex.toString() + "-" + colIndex.toString()
                        })}
                        tableContainer={wrapRef.current ? wrapRef.current : undefined}
                        selectNext={(navigationMode: Navigation) => selectNext.current && selectNext.current(navigationMode)}
                        selectPrevious={(navigationMode: Navigation) => selectPrevious.current && selectPrevious.current(navigationMode)}
                        enterNavigationMode={enterNavigationMode}
                        tabNavigationMode={tabNavigationMode}
                        selectedRow={selectedRow}
                        className={className}
                        colReadonly={columnMetaData?.readonly}
                        tableEnabled={props.enabled}
                        editable={props.editable}
                        startEditing={props.startEditing}
                        insertEnabled={metaData?.insertEnabled}
                        updateEnabled={metaData?.updateEnabled}
                        deleteEnabled={metaData?.deleteEnabled}
                        dataProviderReadOnly={metaData?.readOnly}
                        setIsEditing={setIsEditing}
                        stopEditing={() => {
                            const table = context.contentStore.flatContent.get(id);
                            if (table) {
                                (table as TableProps).startEditing = false;
                                context.subscriptions.propertiesSubscriber.get(id)?.apply(undefined, [table]);
                            }
                        }}
                        rowNumber={tableInfo.rowIndex}
                        colIndex={colIndex}
                        filter={() => {
                            const currDataRow = providerData[tableInfo.rowIndex]
                            return {
                                columnNames: primaryKeys,
                                values: primaryKeys.map(pk => currDataRow[pk])
                            }
                        }}
                        removeTableLinkRef={
                            (columnMetaData?.cellEditor.className === CELLEDITOR_CLASSNAMES.LINKED
                            && (columnMetaData.cellEditor as ICellEditorLinked).displayConcatMask)
                            ?
                                (linkedReferenceDatabook:string) => {
                                    if (linkedRefFetchList.current.includes(linkedReferenceDatabook)) {
                                        linkedRefFetchList.current.splice(linkedRefFetchList.current.findIndex(linkedRef => linkedRef === linkedReferenceDatabook), 1);

                                        if (linkedRefFetchList.current.length === 0) {
                                            setMeasureFlag(prevState => !prevState);
                                        }
                                    }
                                }
                            :
                                undefined
                        }
                        isSelecting={isSelecting} />
                }}
                style={{ whiteSpace: 'nowrap', '--colName': colName }}
                bodyClassName={concatClassnames(
                    className,
                    !columnMetaData?.resizable ? "cell-not-resizable" : "",
                    columnMetaData?.readonly ? "cell-readonly" : "",
                    columnMetaData?.nullable === false ? "cell-required" : ""
                )}
                //loadingBody={() => <div className="loading-text" style={{ height: 30 }} />}
                reorderable={columnMetaData?.movable}
                sortable={props.sortOnHeaderEnabled !== false}
            />
        })
    }, [
        props.columnNames, props.columnLabels, props.dataBook, context.contentStore, props.id,
        context.server.RESOURCE_URL, props.name, screenName, props.tableHeaderVisible, sortDefinitions,
        enterNavigationMode, tabNavigationMode, metaData, primaryKeys, columnOrder, selectedRow, providerData,
        props.startEditing, isSelecting
    ])

    // When a row is selected send a selectRow request to the server
    // If the lib user extends the Table with onRowSelect, call it when a new row is selected.
    const handleRowSelection = async (event: DataTableSelectionChangeParams) => {
        if(event.value && event.originalEvent.type === 'click') {
            let filter:SelectFilter|undefined = undefined
            filter = {
                columnNames: primaryKeys,
                values: primaryKeys.map(pk => event.value.rowData[pk])
            }
            rowSelectionHelper.current = { data: event.value.rowData, selectedColumn: event.value.field, index: event.value.rowIndex, filter: filter, event: event }
            //await sendSelectRequest(event.value.field, filter, event.value.rowIndex)
        }
    }

    /** 
     * When the virtual scroll occurs, set the firstRow index to the current first row of the virtual scroll and check if more data needs to be loaded,
     * if yes, fetch data, no set virtual rows to the next bunch of datarows
     * If the lib user extends the Table with onLazyLoadFetch, call it when the table fetches.
     * @param event - the scroll event
     */
    const handleLazyLoad = useCallback((e: VirtualScrollerLazyParams) => {
        let {first, last} = e;
        if(typeof first === "number" && typeof last === "number") {
            last = Math.max(first, last);
            const length = last - first + 1;
            setListLoading(true);
            firstRowIndex.current = first;
            if((providerData.length < last + length * 2) && !context.contentStore.getDataBook(screenName, props.dataBook)?.allFetched) {
                const fetchReq = createFetchRequest();
                fetchReq.dataProvider = props.dataBook;
                fetchReq.fromRow = providerData.length;
                fetchReq.rowCount = length * 4;
                showTopBar(context.server.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH), topbar).then((result) => {
                    if (props.onLazyLoadFetch && result[0]) {
                        props.onLazyLoadFetch(context.server.buildDatasets(result[0]))
                    }

                    setListLoading(false);
                });
            } else {
                const slicedProviderData = providerData.slice(first, last);
                const data = [...virtualRows];
                data.splice(first, slicedProviderData.length, ...slicedProviderData);
                setVirtualRows(data);
                setListLoading(false);
            }
        }
    }, [virtualRows]);

    /**
     *  When column-resizing stops, adjust the width of resize
     *  If the lib user extends the Table with onColResizeEnd, call it when the column-resizing ends.
     *  @param e - the event
     */
    const handleColResizeEnd = (e:DataTableColumnResizeEndParams) => {
        if (tableRef.current) {
            const widthReq = createWidthRequest();
            let newColumnWidth = e.element.offsetWidth - e.delta;
            widthReq.dataProvider = props.dataBook;
            widthReq.columnName = e.column.props.field;
            if (props.onColResizeEnd) {
                props.onColResizeEnd(e);
            }

            const table = tableRef.current as any;
            const container = table.el;

            //container.querySelector('.p-resizable-column[style*="pointer-events"]').style.removeProperty('pointer-events')
            if (props.autoResize === false) {
                //reverse prime fit sizing                
                let nextColumn = e.element.nextElementSibling as HTMLElement | undefined;
                let nextColumnWidth = nextColumn ? nextColumn.offsetWidth + e.delta : e.delta;

                if (newColumnWidth > 15 && nextColumnWidth > 15) {
                    table.resizeTableCells(newColumnWidth, nextColumnWidth);
                }
                
                newColumnWidth = e.element.offsetWidth + (nextColumn ? e.delta : 0);

                //custom sizing based on primes original column sizing code
                let widths:number[] = [];
                let colIndex = DomHandler.index(table.resizeColumnElement);
                let headers = DomHandler.find(table.table, '.p-datatable-thead > tr > th');
                headers.forEach(header => widths.push(DomHandler.getOuterWidth(header, false)));
        
                table.destroyStyleElement();
                table.createStyleElement();
        
                let innerHTML = '';
                const dp = Math.round(e.delta / (widths.length - colIndex - 1));
                const dpr = e.delta - dp * (widths.length - colIndex - 2);
                const totalWidth = widths.reduce((agg, w) => agg + w, 0);
                widths.forEach((width, index) => {
                    let colWidth = index === colIndex 
                        ? newColumnWidth 
                        : (index > colIndex) 
                            ? width - (index === widths.length - 1 ? dpr : dp) 
                            : width;

                    let style = table.props.scrollable 
                        ? `flex: 0 0 ${colWidth}px !important; max-width: ${colWidth}px` 
                        : `width: ${colWidth}px !important`;
                    
                    innerHTML += `
                        .p-datatable[${table.state.attributeSelector}] .p-datatable-thead > tr > th:nth-child(${index + 1}),
                        .p-datatable[${table.state.attributeSelector}] .p-datatable-tbody > tr > td:nth-child(${index + 1}),
                        .p-datatable[${table.state.attributeSelector}] .p-datatable-tfoot > tr > td:nth-child(${index + 1}) {
                            ${style}
                        }
                    `
                });
                table.styleElement.innerHTML = innerHTML;
                widthReq.width = newColumnWidth;
            }
            else {
                widthReq.width = e.element.offsetWidth;
            }
            showTopBar(context.server.sendRequest(widthReq, REQUEST_KEYWORDS.WIDTH), topbar);
        }
    }

    /**
     * When columns are reordered, set the column order and fix the table css
     * If the lib user extends the Table with onColOrderChange, call it when the column-order changes.
     * @param e - the event
     */
    const handleColReorder = (e:any) => {
        const { dragIndex, dropIndex } = e;
        
        //update primes' table css according to reordering
        let colWidthCSS = (tableRef?.current as any).styleElement?.innerHTML;
        if(colWidthCSS) {
            const fromRegex = new RegExp(`(\\.p-datatable\\[${(tableRef?.current as any).attributeSelector}\\] \\.p-datatable-tfoot > tr > td:nth-child\\(${dragIndex + 1}\\) {)([^}]+)(})`);
            const toRegex = new RegExp(`(\\.p-datatable\\[${(tableRef?.current as any).attributeSelector}\\] \\.p-datatable-tfoot > tr > td:nth-child\\(${dropIndex + 1}\\) {)([^}]+)(})`);
            const from = colWidthCSS.match(fromRegex);
            const to = colWidthCSS.match(toRegex);
            if (from && to) {
                colWidthCSS = colWidthCSS.replace(fromRegex, from[1] +   to[2] + from[3]);
                colWidthCSS = colWidthCSS.replace(toRegex,     to[1] + from[2] +   to[3]);
                (tableRef.current as any).styleElement.innerHTML = colWidthCSS;
            }
        }

        if (props.onColOrderChange) {
            props.onColOrderChange(e.columns.map((column:any) => column.props.field));
        }

        setColumnOrder(e.columns.map((column:any) => column.props.field));
    }
    
    /**
     * Keylistener for the table
     * @param event - the keyboardevent
     */
    const handleTableKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!isEditing) {
            switch (event.key) {
                case "Enter":
                    if (event.shiftKey) {
                        selectPrevious.current && selectPrevious.current(enterNavigationMode);
                    }
                    else {
                        selectNext.current && selectNext.current(enterNavigationMode);
                    }
                    break;
                case "Tab":
                    event.preventDefault();
                    if (event.shiftKey) {
                        selectPrevious.current && selectPrevious.current(tabNavigationMode);
                    }
                    else {
                        selectNext.current && selectNext.current(tabNavigationMode);
                    }
                    break;
                case "PageUp":
                    pageKeyPressed.current = true;
                    event.preventDefault();
                    selectPreviousPage(false);
                    break;
                case "PageDown":
                    pageKeyPressed.current = true;
                    event.preventDefault();
                    selectNextPage(false);
                    break;
                case "ArrowUp":
                    selectPreviousRow(false);
                    break;
                case "ArrowDown":
                    selectNextRow(false);
                    break;
                case "ArrowLeft":
                    selectPreviousCell(false);
                    break;
                case "ArrowRight":
                    selectNextCell(false);
                    break;
                case "Insert":
                    if (metaData?.insertEnabled) {
                        context.contentStore.insertDataProviderData(screenName, props.dataBook);
                        const insertReq = createInsertRecordRequest();
                        insertReq.dataProvider = props.dataBook;
                        showTopBar(context.server.sendRequest(insertReq, REQUEST_KEYWORDS.INSERT_RECORD), topbar);
                    }
                    break;
                case "Delete":
                    if (metaData?.deleteEnabled) {
                        context.contentStore.deleteDataProviderData(screenName, props.dataBook);
                        const selectReq = createSelectRowRequest();
                        selectReq.dataProvider = props.dataBook;
                        selectReq.componentId = props.name;
                        selectReq.rowNumber = selectedRow && selectedRow.index !== undefined ? selectedRow.index : undefined;
                        showTopBar(context.server.sendRequest(selectReq, REQUEST_KEYWORDS.DELETE_RECORD), topbar)
                    }
            }
        }
    }

    /**
     * Sends a sort request to the server
     * @param columnName - the column name
     */
    const handleSort = (columnName:string) => {
        if (clickedResizer.current) {
            clickedResizer.current = false;
        }
        else {
            if (metaData && metaData.columns.find(column => column.name === columnName)?.sortable) {
                const sortDef = sortDefinitions?.find(sortDef => sortDef.columnName === columnName);
                const sortReq = createSortRequest();
                sortReq.dataProvider = props.dataBook;
                sortReq.columnName = columnName
                let sortDefToSend: SortDefinition[] = sortDefinitions || [];
                if (context.ctrlPressed) {
                    if (!sortDef) {
                        sortDefToSend.push({ columnName: columnName, mode: "Ascending" })
                    }
                    else {
                        sortDefToSend[sortDefToSend.findIndex(sortDef => sortDef.columnName === columnName)] = { columnName: columnName, mode: getNextSort(sortDef?.mode) }
                    }
                }
                else {
                    sortDefToSend = [{ columnName: columnName, mode: getNextSort(sortDef?.mode) }]
                }
                sortReq.sortDefinition = sortDefToSend;
                showTopBar(context.server.sendRequest(sortReq, REQUEST_KEYWORDS.SORT), topbar);
            }
        }
    }

    /** Column-resize handler */
    useMultipleEventHandler(
        tableRef.current ?
            //@ts-ignore
            DomHandler.find(tableRef.current.el, "th .p-column-resizer")
            : undefined,
        'mousedown',
        (elem:any) => {
            clickedResizer.current = true;
            //elem instanceof Element ? (elem.parentElement as HTMLElement).style.setProperty('pointer-events', 'none') : undefined
        },
        true
    )

    const focused = useRef<boolean>(false);

    useEffect(() => {
        //this will force the table to refresh its internal visible item count
        setItemSize(tableRowHeight + Math.random() / 1E10);

        if (tableRef.current) {
            const table = tableRef.current as any;
            //resize columns
            if(props.autoResize === false) {
                let presetColumnWidths = 0;
                const idxToSkip:string[] = []
                let innerHTML = '';
                let widths:number[] = [];
                let headers = DomHandler.find(table.table, '.p-datatable-thead > tr > th');
                headers.forEach((header, index) => {
                    const width = header.style.getPropertyValue('width') || DomHandler.getOuterWidth(header, false);
                    if (header.getAttribute("column-width-set")) {
                        let style = table.props.scrollable
                            ? `flex: 0 0 ${width} !important; max-width: ${width}`
                            : `width: ${width} !important`;
                        presetColumnWidths += parseFloat(width);
                        innerHTML += 
                        `
                            .p-datatable[${table.state.attributeSelector}] .p-datatable-thead > tr > th:nth-child(${index + 1}),
                            .p-datatable[${table.state.attributeSelector}] .p-datatable-tbody > tr > td:nth-child(${index + 1}),
                            .p-datatable[${table.state.attributeSelector}] .p-datatable-tfoot > tr > td:nth-child(${index + 1}) {
                                ${style}
                            }
                        `
                        idxToSkip.push(index.toString());
                    }
                    widths.push(parseFloat(width))
                });
                const totalWidth = widths.reduce((agg, w) => agg + w, 0) - presetColumnWidths;
                const tableWidth = table.table.offsetWidth - presetColumnWidths;

                table.destroyStyleElement();
                table.createStyleElement();
                
                widths.forEach((width, index) => {
                    if (!idxToSkip.includes(index.toString())) {
                        let colWidth = (width / totalWidth) * tableWidth;
                        let style = table.props.scrollable 
                            ? `flex: 0 0 ${colWidth}px !important; max-width: ${colWidth}px` 
                            : `width: ${colWidth}px !important`;
                        
                        innerHTML += `
                            .p-datatable[${table.state.attributeSelector}] .p-datatable-thead > tr > th:nth-child(${index + 1}),
                            .p-datatable[${table.state.attributeSelector}] .p-datatable-tbody > tr > td:nth-child(${index + 1}),
                            .p-datatable[${table.state.attributeSelector}] .p-datatable-tfoot > tr > td:nth-child(${index + 1}) {
                                ${style}
                            }
                        `
                    }
                });
                table.styleElement.innerHTML = innerHTML;
            }
        }
    }, [layoutStyle?.width, estTableWidth]);

    return (
        <SelectedCellContext.Provider value={selectedCellId}>
            <div
                ref={wrapRef}
                id={props.name + "-wrapper"}
                style={{
                    ...layoutStyle,
                    ...compStyle,
                    outline: "none",
                    caretColor: "transparent"
                } as any}
                tabIndex={getTabIndex(props.focusable, props.tabIndex ? props.tabIndex : 0)}
                onClick={() => { 
                    if (!focused.current) {
                        focusIsClicked.current = true 
                    }  
                }}
                onFocus={(event) => {
                    //Need to safe it as extra variable because in setTimeout relatedTarget is null
                    const relatedTarget = event.relatedTarget;
                    setTimeout(() => {
                        if (!focused.current) {
                            if (props.eventFocusGained) {
                                onFocusGained(props.name, context.server);
                            }
                            focused.current = true;
                            if (columnOrder && !focusIsClicked.current) {
                                if (relatedTarget === getFocusComponent(props.name + "-wrapper", false)) {
                                    sendSelectRequest(columnOrder[0], undefined, selectedRow.index || 0);
                                }
                                else if (relatedTarget === getFocusComponent(props.name + "-wrapper", true)) {
                                    sendSelectRequest(columnOrder[columnOrder.length - 1], undefined, selectedRow.index || providerData.length - 1)
                                }
                            }
                            focusIsClicked.current = false;
                        }
                    },50)
                }}
                onBlur={event => {
                    if (wrapRef.current
                        && !wrapRef.current.contains(event.relatedTarget as Node) 
                        &&  (event.relatedTarget && !(event.relatedTarget as HTMLElement).classList.contains("celleditor-dropdown-virtual-scroller"))) {
                        if (props.eventFocusLost) {
                            onFocusLost(props.name, context.server);
                        }
                        focused.current = false;
                    }
                }}
                onKeyDown={(event) => handleTableKeys(event)}
                {...usePopupMenu(props)}
            >
                <DataTable
                    key="table"
                    id={props.name}
                    ref={tableRef}
                    className={concatClassnames(
                        "rc-table",
                        props.autoResize === false ? "no-auto-resize" : "",
                        getNavTableClassName(props.parent),
                        styleClassNames
                    )}
                    value={virtualEnabled ? virtualRows : providerData}
                    selection={selectedCell}
                    selectionMode="single"
                    cellSelection
                    scrollHeight={layoutStyle?.height ? `${layoutStyle?.height}px` : undefined}
                    scrollable={virtualEnabled}
                    virtualScrollerOptions={ virtualEnabled ? { 
                        itemSize, 
                        lazy: true,
                        onLazyLoad: handleLazyLoad,
                        loading: listLoading,
                    } : undefined}
                    rows={rows}
                    totalRecords={providerData.length}
                    resizableColumns
                    columnResizeMode={props.autoResize !== false ? "fit" : "expand"}
                    reorderableColumns
                    onSelectionChange={handleRowSelection}
                    onColumnResizeEnd={handleColResizeEnd}
                    onColReorder={handleColReorder}
                    onSort={(event) => handleSort(event.sortField)}
                    rowClassName={(data) => {
                        let cn: any = {}
                        if (selectedRow && selectedRow.data === data && props.showSelection !== false) {
                            cn["p-highlight"] = true;
                        }
                        if (data?.recordStatus === "D") {
                            cn["row-deleted"] = true;
                        }
                        return cn
                    }}
                    emptyMessage={""}
                    breakpoint="0px" >
                    {columns}
                </DataTable>
            </div>
        </SelectedCellContext.Provider>
    )
}
export default UITable