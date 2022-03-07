/** React imports */
import React, { createContext, FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

/** 3rd Party imports */
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import _ from "underscore";

/** Hook imports */
import { useDataProviderData, 
         useRowSelect, 
         useMultipleEventHandler, 
         useSortDefinitions, 
         useFetchMissingData,
         useMouseListener,
         useMetaData,
         usePopupMenu,
         useComponentConstants} from "../zhooks";

/** Other imports */
import BaseComponent from "../BaseComponent";
import { createFetchRequest, createInsertRecordRequest, createSelectRowRequest, createSortRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS, SortDefinition, SelectFilter } from "../../request";
import { LengthBasedColumnDescription, MetaDataResponse, NumericColumnDescription } from "../../response";
import { parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, Dimension, concatClassnames, getFocusComponent, checkComponentName } from "../util";
import { showTopBar } from "../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../util/SendFocusRequests";
import { CellEditorWrapper, CELLEDITOR_CLASSNAMES } from "../editors";
import { IToolBarPanel } from "../panels/toolbarPanel/UIToolBarPanel";
import { VirtualScrollerLazyParams } from "primereact/virtualscroller";
import { DomHandler } from "primereact/utils";
import { CellEditor } from "./CellEditor";
import { RequestQueueMode } from "../../Server";


/** Interface for Table */
export interface TableProps extends BaseComponent{
    classNameComponentRef: string,
    columnLabels: Array<string>,
    columnNames: Array<string>,
    dataBook: string,
    tableHeaderVisible?: boolean
    autoResize?: boolean,
    enterNavigationMode?: number,
    tabNavigationMode?: number
    enabled?: boolean,
    startEditing?:boolean
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
function isVisible(ele:HTMLElement, container:HTMLElement, cell:any) {
    if (ele) {
        const eleLeft = ele.offsetLeft;
        const eleRight = eleLeft + ele.clientWidth;
    
        const containerLeft = container.scrollLeft;
        const containerRight = containerLeft + container.clientWidth;

        const eleTop = cell.rowIndex * (parseInt(window.getComputedStyle(document.documentElement).getPropertyValue("--table-data-height")) + 8);
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
const UITable: FC<TableProps> = (baseProps) => {
    /** Reference for the div wrapping the Table */
    const wrapRef = useRef<HTMLDivElement>(null);

    /** Reference for the Table */
    const tableRef = useRef<DataTable>(null);

    /** Component constants */
    const [context, topbar, [props], layoutStyle, translation, compStyle] = useComponentConstants<TableProps>(baseProps);

    /** ComponentId of the screen */
    const compId = useMemo(() => context.contentStore.getComponentId(props.id, props.dataBook) as string, [context.contentStore, props.id]);

    /** Metadata of the databook */
    const metaData = useMetaData(compId, props.dataBook, undefined);

    /** The data provided by the databook */
    const [providerData] = useDataProviderData(compId, props.dataBook);

    /** The amount of virtual rows loaded */
    const rows = 40;

    /** Virtual scrolling is enabled (lazy loading), if the provided data is greater than 2 times the row value*/
    const virtualEnabled = useMemo(() => {
        return providerData.length > rows * 2
    }, [providerData.length]);

    /** The virtual rows filled with data */
    const [virtualRows, setVirtualRows] = useState<any[]>((() => { 
        const out = Array.from({ length: providerData.length });
        out.splice(0, rows, ...providerData.slice(0, rows)); 
        return out;
    })());


    /** the list row height */
    const [itemSize, setItemSize] = useState(parseInt(window.getComputedStyle(document.documentElement).getPropertyValue("--table-data-height")) + 8);

    /** The current firstRow displayed in the table */
    const firstRowIndex = useRef(0);

    /** The current sort-definitions */
    const [sortDefinitions] = useSortDefinitions(compId, props.dataBook);

    /** The current order of the columns */
    const [columnOrder, setColumnOrder] = useState<string[]|undefined>(metaData?.columnView_table_);

    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataBook, undefined, true);

    /** Reference if the page up/down key was pressed */
    const pageKeyPressed = useRef<boolean>(false);

    /** Reference of the last selected row used for scrolling */
    const lastSelectedRowIndex = useRef<number|undefined>(selectedRow ? selectedRow.index : undefined);

    const focusIsClicked = useRef<boolean>(false);

    const [listLoading, setListLoading] = useState(false);

    /** The primary keys of a table */
    const primaryKeys:string[] = useMemo(() => {
        let pks:(LengthBasedColumnDescription | NumericColumnDescription)[] | undefined;
        if (metaData) {
            if (metaData.primaryKeyColumns) {
                return metaData.primaryKeyColumns
            }
            else if (metaData.columns.find(column => column.name === "ID")) {
                return ["ID"];
            }
            else {
                pks = metaData.columns.filter(column => column.cellEditor.className === CELLEDITOR_CLASSNAMES.TEXT || column.cellEditor.className === CELLEDITOR_CLASSNAMES.NUMBER);
                let pkNames:string[] = pks.map(pk => pk.name);
                return pkNames
            }
        }
        else {
            return []
        }
    }, [metaData]);

    /** The selected cell */
    const [selectedCellId, setSelectedCellId] = useState<ISelectedCell>({selectedCellId: "notSet"});

    useFetchMissingData(compId, props.dataBook);

    const heldMouseEvents = useRef<Set<Function>>(new Set());
    /** Hook for MouseListener */
    useMouseListener(
        props.name, 
        tableRef.current ? (virtualEnabled ? (tableRef.current as any).el : (tableRef.current as any).table) : undefined, 
        props.eventMouseClicked, 
        props.eventMousePressed, 
        props.eventMouseReleased,
        (type, release) => {
            heldMouseEvents.current.add(release);
            if (type === "clicked" || type === "cancelled") {
                setTimeout(() => {
                    heldMouseEvents.current.forEach(release => release())
                    heldMouseEvents.current.clear()
                }, 1)
            }
        }
    );

    /**
     * Sends a selectRequest to the server, if a new row is selected selectRow, else selectColumn
     * @param selectedColumn - the selected column
     * @param filter - if a new row is selected, the filter to send to the server
     */
    const sendSelectRequest = useCallback(async (selectedColumn?:string, filter?:SelectFilter) => {
        const selectReq = createSelectRowRequest();
        selectReq.dataProvider = props.dataBook;
        selectReq.componentId = props.name;
        if (selectedColumn) selectReq.selectedColumn = selectedColumn;
        if (filter) selectReq.filter = filter;
        await showTopBar(context.server.sendRequest(selectReq, filter ? REQUEST_ENDPOINTS.SELECT_ROW : REQUEST_ENDPOINTS.SELECT_COLUMN, undefined, undefined, true, RequestQueueMode.IMMEDIATE), topbar);
    }, [props.dataBook, props.name, context.server])

    /**
     * Returns the number of records visible based on row height.
     * @returns the number of records visible based on row height.
     */
    const getNumberOfRowsPerPage = () => {
        return Math.floor((layoutStyle?.height as number - 40) / (parseInt(window.getComputedStyle(document.documentElement).getPropertyValue("--table-data-height")) + 8))
    }

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
                    const moveDirections = isVisible(selectedElem, container, cell);
                    if (pageKeyPressed.current !== false) {
                        pageKeyPressed.current = false;
                        container.scrollTo(selectedElem ? selectedElem.offsetLeft : 0, cell.rowIndex * (parseInt(window.getComputedStyle(document.documentElement).getPropertyValue("--table-data-height")) + 8));
                        container.focus();
                    }
                    else if (selectedElem !== null) {
                        let sLeft:number = container.scrollLeft
                        let sTop:number = container.scrollTop
    
                        if (moveDirections.visLeft !== CellVisibility.FULL_VISIBLE) {
                            sLeft = selectedElem.offsetLeft;
                        }
    
                        if (moveDirections.visTop === CellVisibility.NOT_VISIBLE) {
                            sTop = cell.rowIndex * (parseInt(window.getComputedStyle(document.documentElement).getPropertyValue("--table-data-height")) + 8);
                        }
                        else if (moveDirections.visTop === CellVisibility.PART_VISIBLE) {
                            sTop = container.scrollTop + (isNext ? (parseInt(window.getComputedStyle(document.documentElement).getPropertyValue("--table-data-height")) + 8) : -(parseInt(window.getComputedStyle(document.documentElement).getPropertyValue("--table-data-height")) + 8));
                        }
                        container.scrollTo(sLeft, sTop);
                    }
                    else {
                        container.scrollTo(container.scrollLeft, cell.rowIndex * (parseInt(window.getComputedStyle(document.documentElement).getPropertyValue("--table-data-height")) + 8));
                    }
                }
            }
        }, 0)
    }

    /** Creates and returns the selectedCell object */
    const selectedCell = useMemo(() => {
        if (selectedRow && columnOrder) {
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
                sendSelectRequest(columnOrder[0]);
            }
        }
        return undefined
    }, [selectedRow, columnOrder]);

    /** The estimated table width */
    const [estTableWidth, setEstTableWidth] = useState(0);

    /** The navigation-mode for the enter key sent by the server default: cell and focus */
    const enterNavigationMode = props.enterNavigationMode || Navigation.NAVIGATION_CELL_AND_FOCUS;

    /** The navigation-mode for the tab key sent by the server default: cell and focus */
    const tabNavigationMode = props.tabNavigationMode || Navigation.NAVIGATION_CELL_AND_FOCUS;

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps

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

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useEffect(() => {
        if(wrapRef.current){
            if(onLoadCallback) {
                if (props.preferredSize) {
                    sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback)
                }
                else {
                    /** If the provided data is more than 10, send a fixed height if less, calculate the height */
                    const prefSize:Dimension = {height: providerData.length < 10 ? providerData.length * (parseInt(window.getComputedStyle(document.documentElement).getPropertyValue("--table-data-height")) + 8) + (props.tableHeaderVisible !== false ? 42 : 3) : 410, width: estTableWidth+4}
                    sendOnLoadCallback(id, props.className, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback)
                }  
            }    
        }
    }, [id, onLoadCallback, props.preferredSize, providerData.length, props.maximumSize, props.minimumSize, estTableWidth, props.tableHeaderVisible]);

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
                                tempWidth = cellDatas[j].getBoundingClientRect().width + 30;
                            }
                            else if (cellDatas[j].parentElement?.classList.contains('ChoiceCellEditor')) {
                                tempWidth = 24;
                            }
                            else {
                                tempWidth = cellDatas[j].getBoundingClientRect().width;
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
                //@ts-ignore
                const currentTable:HTMLTableElement = tableRef?.current?.table;
                if (currentTable) {
                    const theader = currentTable.querySelectorAll('th');
                    const trows = currentTable.querySelectorAll('tbody > tr');

                    /** First set width of headers for columns then rows */
                    for (let i = 0; i < theader.length; i++) {
                        const newCellWidth = { widthPreSet: false, width: 0 }
                        const colName = window.getComputedStyle(theader[i]).getPropertyValue('--columnName');
                        const columnMetaData = getColMetaData(colName, metaData)
                        if (columnMetaData?.width) {
                            newCellWidth.width = columnMetaData.width;
                            newCellWidth.widthPreSet = true
                        }
                        else {
                            const title = theader[i].querySelector('.p-column-title');
                            newCellWidth.width = title ? title.getBoundingClientRect().width + 34 : 0;
                        }
                        cellDataWidthList.push(newCellWidth);
                    }
                    (tableRef.current as any).el.classList.add("read-size");
                    for (let i = 0; i < Math.min(trows.length, 100); i++) {
                        goThroughCellData(trows, i);
                    }
                    (tableRef.current as any).el.classList.remove("read-size");

                    let tempWidth: number = 0;
                    cellDataWidthList.forEach(cellDataWidth => {
                        tempWidth += cellDataWidth.width
                    });

                    /** set EstTableWidth for size reporting */
                    setEstTableWidth(tempWidth);
                }
                else {
                    setEstTableWidth(0);
                }
            }, 0);
        }
    }, []);

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

        if (metaData?.columnView_table_) {
            setColumnOrder(metaData.columnView_table_);
        }
    },[metaData])

    /** When providerData changes set state of virtual rows*/
    useLayoutEffect(() => {
        setVirtualRows((() => { 
            const out = Array.from({ length: providerData.length });
            out.splice(firstRowIndex.current, rows, ...providerData.slice(firstRowIndex.current, firstRowIndex.current + rows));
            return out;
        })());
    }, [providerData]);

    /** Adds the sort classnames to the headers for styling */
    useEffect(() => {
        if (tableRef.current) {
            const table = tableRef.current as any;
            const allTableColumns = DomHandler.find(table.table, '.p-datatable-thead > tr > th');
            for (const col of allTableColumns) {
                const sortIcon = col.querySelector('.p-sortable-column-icon');
                col.classList.remove("sort-asc", "sort-des");
                sortIcon.classList.remove("pi-sort-amount-up-alt", "pi-sort-amount-down");
                const columnName = window.getComputedStyle(col).getPropertyValue('--columnName');
                const sortDef = sortDefinitions?.find(sortDef => sortDef.columnName === columnName);
                if (sortDef !== undefined) {
                    if (sortDef.mode === "Ascending") {
                        col.classList.add("sort-asc");
                        sortIcon.classList.add("pi-sort-amount-up-alt");
                    }
                    else if (sortDef.mode === "Descending") {
                        col.classList.add("sort-des");
                        sortIcon.classList.add("pi-sort-amount-down");
                    }
                }
            }
            
        }

    }, [sortDefinitions]);

    /** Removes the highlight classname from the previous selected cell and adds it to the current, needed because PrimeReact selection with virtual tables doesn't work properly */
    useEffect(() => {
        if (tableRef.current) {
            const table = (tableRef.current as any).el
            const selectedTds = DomHandler.find(table, 'tbody > tr td.p-highlight');
            if (selectedTds) {
                for (const elem of selectedTds) {
                    elem.classList.remove("p-highlight");
                }
            }
    
            const highlightedRow = DomHandler.findSingle(table, 'tbody > tr.p-highlight');
            if (selectedRow && columnOrder) {
                const colIdx = columnOrder.findIndex(col => col === selectedRow.selectedColumn);
                if (highlightedRow && colIdx >= 0 && !highlightedRow.children[colIdx].classList.contains(".p-highlight")) {
                    highlightedRow.children[colIdx].classList.add("p-highlight");
                }
            }
        }

    }, [virtualRows, selectedRow, columnOrder]);

    /**
     * Selects the next cell, if there is no cell anymore and delegateFocus is true, focus the next component
     * @param delegateFocus - true if the next component should be focused if there are no more cells
     */
    const selectNextCell = useCallback(async (delegateFocus:boolean) => {
        if (selectedRow !== undefined && columnOrder) {
            const newSelectedColumnIndex = columnOrder.findIndex(column => column === selectedRow.selectedColumn) + 1;
            if (newSelectedColumnIndex < columnOrder.length) {
                const newSelectedColumn = columnOrder[newSelectedColumnIndex];
                await sendSelectRequest(newSelectedColumn);
            }
            else if (delegateFocus) {
                getFocusComponent(props.name + "-wrapper", true)?.focus();
            }
        }
        else if (delegateFocus) {
            getFocusComponent(props.name + "-wrapper", true)?.focus();
        }
    }, [selectedRow, columnOrder, sendSelectRequest])

    /**
     * Selects the previous cell, if there is no cell anymore and delegateFocus is true, focus the previous component
     * @param delegateFocus - true if the previous component should be focused if there are no more cells
     */
    const selectPreviousCell = useCallback(async (delegateFocus:boolean) => {
        if (selectedRow !== undefined && columnOrder) {
            const newSelectedColumnIndex = columnOrder.findIndex(column => column === selectedRow.selectedColumn) - 1;
            if (newSelectedColumnIndex >= 0) {
                const newSelectedColumn = columnOrder[newSelectedColumnIndex];
                await sendSelectRequest(newSelectedColumn);
            }
            else if (delegateFocus) {
                getFocusComponent(props.name + "-wrapper", false)?.focus();
            }
        }
        else if (delegateFocus) {
            getFocusComponent(props.name + "-wrapper", false)?.focus();
        }
    }, [selectedRow, columnOrder, sendSelectRequest])

    /**
     * Selects the next row, if there is no row anymore and delegateFocus is true, focus the next component
     * @param delegateFocus - true if the next component should be focused if there are no more rows
     */
    const selectNextRow = useCallback(async (delegateFocus:boolean) => {
        if (selectedRow !== undefined) {
            const nextSelectedRowIndex = selectedRow.index + 1;
            if (nextSelectedRowIndex < providerData.length) {
                let filter:SelectFilter = {
                    columnNames: primaryKeys,
                    values: primaryKeys.map(pk => providerData[nextSelectedRowIndex][pk])
                };
                await sendSelectRequest(undefined, filter);
            }
            else if (delegateFocus) {
                getFocusComponent(props.name + "-wrapper", true)?.focus();
            }
        }
        else if (delegateFocus) {
            getFocusComponent(props.name + "-wrapper", true)?.focus();
        }
    }, [selectedRow, primaryKeys, providerData, sendSelectRequest])

    /**
     * Selects the previous row, if there is no row anymore and delegateFocus is true, focus the previous component
     * @param delegateFocus - true if the previous component should be focused if there are no more rows
     */
    const selectPreviousRow = useCallback(async (delegateFocus:boolean) => {
        if (selectedRow !== undefined) {
            const prevSelectedRowIndex = selectedRow.index - 1;
            if (prevSelectedRowIndex >= 0) {
                let filter:SelectFilter = {
                    columnNames: primaryKeys,
                    values: primaryKeys.map(pk => providerData[prevSelectedRowIndex][pk])
                };
                await sendSelectRequest(undefined, filter);
            }
            else if (delegateFocus) {
                getFocusComponent(props.name + "-wrapper", false)?.focus();
            }
        }
        else if (delegateFocus) {
            getFocusComponent(props.name + "-wrapper", false)?.focus();
        }
    }, [selectedRow, primaryKeys, providerData, sendSelectRequest])

    /**
     * Selects the next cell, if there is no cell anymore select the next row and so on. If there is no more cells/rows and delegateFocus is true, focus the next component
     * @param delegateFocus - true if the next component should be focused if there are no more cells/rows
     */
    const selectNextCellAndRow = useCallback(async (delegateFocus:boolean) => {
        if (selectedRow !== undefined && columnOrder) {
            const newSelectedColumnIndex = columnOrder.findIndex(column => column === selectedRow.selectedColumn) + 1;
            const nextSelectedRowIndex = selectedRow.index + 1;
            if (newSelectedColumnIndex < columnOrder.length) {
                const newSelectedColumn = columnOrder[newSelectedColumnIndex];
                await sendSelectRequest(newSelectedColumn);
            }
            else if (nextSelectedRowIndex < providerData.length) {
                let filter:SelectFilter = {
                    columnNames: primaryKeys,
                    values: primaryKeys.map(pk => providerData[nextSelectedRowIndex][pk])
                };
                await sendSelectRequest(columnOrder[0], filter);
            }
            else if (delegateFocus) {
                getFocusComponent(props.name + "-wrapper", true)?.focus();
            }
        }
        else if (delegateFocus) {
            getFocusComponent(props.name + "-wrapper", true)?.focus();
        }
    }, [selectedRow, primaryKeys, columnOrder, providerData, sendSelectRequest])

    /**
     * Selects the previous cell, if there is no cell anymore select the previous row and so on. If there is no more cells/rows and delegateFocus is true, focus the next component
     * @param delegateFocus - true if the previous component should be focused if there are no more cells/rows
     */
    const selectPreviousCellAndRow = useCallback(async (delegateFocus:boolean) => {
        if (selectedRow !== undefined && columnOrder) {
            const prevSelectedColumnIndex = columnOrder.findIndex(column => column === selectedRow.selectedColumn) - 1;
            const prevSelectedRowIndex = selectedRow.index - 1;
            if (prevSelectedColumnIndex >= 0) {
                const newSelectedColumn = columnOrder[prevSelectedColumnIndex];
                await sendSelectRequest(newSelectedColumn);
            }
            else if (prevSelectedRowIndex >= 0) {
                let filter:SelectFilter = {
                    columnNames: primaryKeys,
                    values: primaryKeys.map(pk => providerData[prevSelectedRowIndex][pk])
                };
                await sendSelectRequest(columnOrder[columnOrder.length - 1], filter);
            }
            else if (delegateFocus) {
                getFocusComponent(props.name + "-wrapper", false)?.focus();
            }
        }
        else if (delegateFocus) {
            getFocusComponent(props.name + "-wrapper", false)?.focus();
        }
    }, [selectedRow, primaryKeys, columnOrder, providerData, sendSelectRequest])

    /** 
     * Selects a row which is further down based on the height of the table if there are no more rows and delegate Focus is true, focus the next component
     * @param delegateFocus - true if the next component should be focused if there are no more rows
     */
    const selectNextPage = async (delegateFocus: boolean) => {
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
                await sendSelectRequest(undefined, filter);
            }
            else if (delegateFocus) {
                getFocusComponent(props.name + "-wrapper", true)?.focus();
            }
        }
    }

    /** 
     * Selects a row which is further up based on the height of the table if there are no more rows and delegate Focus is true, focus the previous component
     * @param delegateFocus - true if the previous component should be focused if there are no more rows
     */
    const selectPreviousPage = async (delegateFocus: boolean) => {
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
                await sendSelectRequest(undefined, filter);
            }
            else if (delegateFocus) {
                getFocusComponent(props.name + "-wrapper", false)?.focus();
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
                selectNextCell(true);
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
                    {props.columnLabels[colIndex] + (getColMetaData(colName, metaData)?.nullable ? "" : " *")}
                    <span className="p-sortable-column-icon pi pi-fw"></span>
                    <span className="sort-index" onClick={() => handleSort(colName)}>{sortIndex}</span>
                </>)
        }

        return props.columnNames.map((colName, colIndex) => {
            const columnMetaData = getColMetaData(colName, metaData)
            const className = columnMetaData?.cellEditor?.className;
            return <Column
                field={colName}
                header={createColumnHeader(colName, colIndex)}
                key={colName}
                headerStyle={{
                    overflowX: "hidden",
                    whiteSpace: 'nowrap',
                    textOverflow: 'Ellipsis',
                    display: props.tableHeaderVisible === false ? 'none' : undefined,
                    '--columnName': colName
                }}
                body={(rowData: any, tableInfo: any) => {
                    if (!rowData) { return <div></div> }
                    if (columnMetaData?.cellEditor.directCellEditor) {
                        return <CellEditorWrapper
                        {...{
                            id: "",
                            ...columnMetaData,
                            name: props.name,
                            dataRow: props.dataBook,
                            columnName: colName,
                            cellEditor_editable_: true,
                            editorStyle: { width: "100%", height: "100%" },
                            autoFocus: true,
                            rowIndex: () => tableInfo.rowIndex + firstRowIndex.current,
                            filter: () => {
                                const currDataRow = providerData[tableInfo.rowIndex + firstRowIndex.current]
                                return {
                                    columnNames: primaryKeys,
                                    values: primaryKeys.map(pk => currDataRow[pk])
                                }
                            },
                            readonly: columnMetaData?.readonly,
                            isCellEditor: true,
                            cellCompId: props.dataBook.split("/")[1]
                        }} 
                        />
                    }
                    else {
                        return <CellEditor
                            pk={_.pick(rowData, primaryKeys)}
                            compId={compId}
                            name={props.name as string}
                            colName={colName}
                            dataProvider={props.dataBook}
                            cellData={rowData[colName]}
                            cellFormatting={rowData.__recordFormats && rowData.__recordFormats[props.name] && rowData.__recordFormats[props.name][colName]}
                            resource={context.server.RESOURCE_URL}
                            cellId={() => { return { selectedCellId: props.id + "-" + (tableInfo.rowIndex + firstRowIndex.current).toString() + "-" + colIndex.toString() } }}
                            tableContainer={wrapRef.current ? wrapRef.current : undefined}
                            selectNext={(navigationMode: Navigation) => selectNext.current && selectNext.current(navigationMode)}
                            selectPrevious={(navigationMode: Navigation) => selectPrevious.current && selectPrevious.current(navigationMode)}
                            enterNavigationMode={enterNavigationMode}
                            tabNavigationMode={tabNavigationMode}
                            selectedRow={selectedRow}
                            className={className}
                            readonly={columnMetaData?.readonly}
                            tableEnabled={props.enabled}
                            startEditing={props.startEditing}
                            stopEditing={() => {
                                const test = context.contentStore.flatContent.get(id);
                                (test as TableProps).startEditing = false;
                                context.subscriptions.propertiesSubscriber.get(id)?.apply(undefined, [test]);
                            }} />
                    }
                }
                }
                style={{ whiteSpace: 'nowrap', lineHeight: '14px' }}
                bodyClassName={concatClassnames(
                    className,
                    !columnMetaData?.resizable ? "cell-not-resizable" : "",
                    columnMetaData?.readonly ? "cell-readonly" : "",
                    columnMetaData?.nullable === false ? "cell-required" : ""
                )}
                //loadingBody={() => <div className="loading-text" style={{ height: 30 }} />}
                reorderable={columnMetaData?.movable}
                sortable
            />
        })
    }, [
        props.columnNames, props.columnLabels, props.dataBook, context.contentStore, props.id,
        context.server.RESOURCE_URL, props.name, compId, props.tableHeaderVisible, sortDefinitions,
        enterNavigationMode, tabNavigationMode, metaData, primaryKeys, columnOrder, selectedRow, providerData, 
        props.startEditing
    ])

    /** When a row is selected send a selectRow request to the server */
    const handleRowSelection = async (event: {originalEvent: any, value: any}) => {
        if(event.value && event.originalEvent.type === 'click') {
            const isNewRow = selectedRow ? event.value.rowIndex !== selectedRow.index : true;
            let filter:SelectFilter|undefined = undefined
            if (isNewRow) {
                filter = {
                    columnNames: primaryKeys,
                    values: primaryKeys.map(pk => event.value.rowData[pk])
                }
            }
            await sendSelectRequest(event.value.field, filter)
        }
    }

    /** 
     * When the virtual scroll occurs, set the firstRow index to the current first row of the virtual scroll and check if more data needs to be loaded,
     * if yes, fetch data, no set virtual rows to the next bunch of datarows
     * @param event - the scroll event
     */
    const handleLazyLoad = useCallback((e: VirtualScrollerLazyParams) => {
        let {first, last} = e;
        if(typeof first === "number" && typeof last === "number") {
            last = Math.max(first, last);
            const length = last - first + 1;
            setListLoading(true);
            firstRowIndex.current = first;
            if((providerData.length < last + length * 2) && !context.contentStore.getDataBook(compId, props.dataBook)?.allFetched) {
                const fetchReq = createFetchRequest();
                fetchReq.dataProvider = props.dataBook;
                fetchReq.fromRow = providerData.length;
                fetchReq.rowCount = length * 4;
                showTopBar(context.server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH), topbar).then(() => {
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
     *  @param e - the event
     */
    const handleColResizeEnd = (e:any) => {
        if (tableRef.current) {
            const table = tableRef.current as any;
            const container = table.el;

            container.querySelector('.p-resizable-column[style*="pointer-events"]').style.removeProperty('pointer-events')
            if (props.autoResize === false) {
                //reverse prime fit sizing
                let newColumnWidth = e.element.offsetWidth - e.delta;
                let nextColumn = e.element.nextElementSibling;
                let nextColumnWidth = nextColumn.offsetWidth + e.delta;

                if (newColumnWidth > 15 && nextColumnWidth > 15) {
                    table.resizeTableCells(newColumnWidth, nextColumnWidth);
                }
                
                newColumnWidth = e.element.offsetWidth + e.delta;

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
                widths.forEach((width, index) => {
                    let colWidth = index === colIndex 
                        ? newColumnWidth 
                        : (index > colIndex) 
                            ? width - (index === widths.length - 1 ? dpr : dp) 
                            : width;

                    let style = table.props.scrollable 
                        ? `flex: 0 0 ${colWidth}px !important` 
                        : `width: ${colWidth}px !important`;
                    
                    innerHTML += `
                        .p-datatable[${table.attributeSelector}] .p-datatable-thead > tr > th:nth-child(${index + 1}),
                        .p-datatable[${table.attributeSelector}] .p-datatable-tbody > tr > td:nth-child(${index + 1}),
                        .p-datatable[${table.attributeSelector}] .p-datatable-tfoot > tr > td:nth-child(${index + 1}) {
                            ${style}
                        }
                    `
                });
                table.styleElement.innerHTML = innerHTML;
            }
        }
    }

    /**
     * When columns are reordered, set the column order and fix the table css
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

        setColumnOrder(e.columns.map((column:any) => column.props.field));
    }
    
    /**
     * Keylistener for the table
     * @param event - the keyboardevent
     */
    const handleTableKeys = (event:React.KeyboardEvent<HTMLDivElement>) => {
        switch(event.key) {
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
                    context.contentStore.insertDataProviderData(compId, props.dataBook);
                    const insertReq = createInsertRecordRequest();
                    insertReq.dataProvider = props.dataBook;
                    showTopBar(context.server.sendRequest(insertReq, REQUEST_ENDPOINTS.INSERT_RECORD), topbar);
                }
                break;
            case "Delete":
                if (metaData?.deleteEnabled) {
                    context.contentStore.deleteDataProviderData(compId, props.dataBook);
                    const selectReq = createSelectRowRequest();
                    selectReq.dataProvider = props.dataBook;
                    selectReq.componentId = props.name;
                    showTopBar(context.server.sendRequest(selectReq, REQUEST_ENDPOINTS.DELETE_RECORD), topbar)
                }
        }
    }

    /**
     * Sends a sort request to the server
     * @param columnName - the column name
     */
    const handleSort = (columnName:string) => {
        const sortDef = sortDefinitions?.find(sortDef => sortDef.columnName === columnName);
        const sortReq = createSortRequest();
        sortReq.dataProvider = props.dataBook;
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
        showTopBar(context.server.sendRequest(sortReq, REQUEST_ENDPOINTS.SORT), topbar);
    }

    /** Column-resize handler */
    useMultipleEventHandler(
        tableRef.current ?
            //@ts-ignore
            DomHandler.find(tableRef.current.el, "th .p-column-resizer")
            : undefined,
        'mousedown',
        (elem:any) => elem instanceof Element ? (elem.parentElement as HTMLElement).style.setProperty('pointer-events', 'none') : undefined,
        true
    )

    const focused = useRef<boolean>(false);

    useEffect(() => {
        //this will force the table to refresh its internal visible item count
        setItemSize(parseInt(window.getComputedStyle(document.documentElement).getPropertyValue("--table-data-height")) + 8 + Math.random() / 1E10);

        if (tableRef.current) {
            const table = tableRef.current as any;
            //resize columns
            if(props.autoResize === false) {
                let widths:number[] = [];
                let headers = DomHandler.find(table.table, '.p-datatable-thead > tr > th');
                headers.forEach(header => widths.push(DomHandler.getOuterWidth(header, false)));
                const totalWidth = widths.reduce((agg, w) => agg + w, 0);
                const tableWidth = table.table.offsetWidth;

                table.destroyStyleElement();
                table.createStyleElement();

                let innerHTML = '';
                widths.forEach((width, index) => {
                    let colWidth = (width / totalWidth) * tableWidth;

                    let style = table.props.scrollable 
                        ? `flex: 0 0 ${colWidth}px !important` 
                        : `width: ${colWidth}px !important`;
                    
                    innerHTML += `
                        .p-datatable[${table.attributeSelector}] .p-datatable-thead > tr > th:nth-child(${index + 1}),
                        .p-datatable[${table.attributeSelector}] .p-datatable-tbody > tr > td:nth-child(${index + 1}),
                        .p-datatable[${table.attributeSelector}] .p-datatable-tfoot > tr > td:nth-child(${index + 1}) {
                            ${style}
                        }
                    `
                });
                table.styleElement.innerHTML = innerHTML;              
            }
        }
    }, [layoutStyle?.width]);

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
                tabIndex={props.tabIndex ? props.tabIndex : 0}
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
                                    sendSelectRequest(columnOrder[0]);
                                }
                                else if (relatedTarget === getFocusComponent(props.name + "-wrapper", true)) {
                                    sendSelectRequest(columnOrder[columnOrder.length - 1])
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
                    id={checkComponentName(props.name)}
                    ref={tableRef}
                    className={concatClassnames(
                        "rc-table",
                        props.autoResize === false ? "no-auto-resize" : "",
                        getNavTableClassName(props.parent)
                    )}
                    value={virtualRows}
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
                        if (selectedRow && selectedRow.data === data) {
                            cn["p-highlight"] = true;
                        }
                        if (data?.recordStatus === "D") {
                            cn["row-deleted"] = true;
                        }
                        return cn
                    }}
                    tabIndex={props.tabIndex}
                    emptyMessage={""}
                    breakpoint="0px" >
                    {columns}
                </DataTable>
            </div>
        </SelectedCellContext.Provider>
    )
}
export default UITable