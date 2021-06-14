/** React imports */
import React, { createContext, FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

/** 3rd Party imports */
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import _ from "underscore";

/** Hook imports */
import { useProperties, 
         useDataProviderData, 
         useRowSelect, 
         useOutsideClick, 
         useMultipleEventHandler, 
         useSortDefinitions, 
         useEventHandler} from "../zhooks";

/** Other imports */
import BaseComponent from "../BaseComponent";
import { LayoutContext } from "../../LayoutContext";
import { appContext } from "../../AppProvider";
import { createFetchRequest, createInsertRecordRequest, createSelectRowRequest, createSortRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS, SortDefinition, SelectFilter } from "../../request";
import { MetaDataResponse } from "../../response";
import { getMetaData, parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, Dimension, concatClassnames, focusComponent } from "../util";
import { cellRenderer, displayEditor } from "./CellDisplaying";


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

/** Type for CellEditor */
type CellEditor = {
    pk: any,
    compId: string,
    name: string,
    cellData: any,
    dataProvider: string,
    colName: string,
    metaData: MetaDataResponse | undefined,
    resource: string,
    cellId: ISelectedCell,
    tableContainer?: any,
    selectNext: Function,
    selectPrevious: Function,
    enterNavigationMode: number,
    tabNavigationMode: number,
    selectedRow: any,
    className?: string
}

export type PassedToEditor = {
    click:boolean,
    passKey:string
}

interface ISelectedCell {
    selectedCellId?:string
}

export const SelectedCellContext = createContext<ISelectedCell>({})

/**
 * This component displays either just the value of the cell or an in-cell editor
 * @param props - props received by Table
 */
const CellEditor: FC<CellEditor> = (props) => {
    const { selectNext, selectPrevious, enterNavigationMode, tabNavigationMode, tableContainer, className } = props;
    
    /** State if editing is currently possible */
    const [edit, setEdit] = useState(false);

    /** Reference for element wrapping the cell value/editor */
    const wrapperRef = useRef(null);

    const passRef = useRef<PassedToEditor>({click: false, passKey: ""})

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const cellContext = useContext(SelectedCellContext);

    /** Metadata of the columns */
    const columnMetaData = props.metaData?.columns.find(column => column.name === props.colName);

    /** State if the CellEditor is currently waiting for the selectedRow */
    const [waiting, setWaiting] = useState<boolean>(false);

    /** When a new selectedRow is set, set waiting to false */
    useEffect(() => {
        if (props.selectedRow) {
            if (!edit) {
                passRef.current = {click: false, passKey: ""};
            }
            const pickedVals = _.pick(props.selectedRow.data, Object.keys(props.pk));
            if (waiting && _.isEqual(pickedVals, props.pk)) {
                setWaiting(false);
            }
        }
    }, [props.selectedRow, edit])

    useEffect(() => {
        if (cellContext.selectedCellId !== props.cellId.selectedCellId) {
            if (edit) {
                setEdit(false);
            }
        }
        if (cellContext.selectedCellId === props.cellId.selectedCellId && (className === "ChoiceCellEditor" || className === "CheckBoxCellEditor")) {
            setEdit(true);
        }
    }, [cellContext.selectedCellId]);

    const stopCellEditing = useCallback((event?:KeyboardEvent) => {
        setEdit(false);
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
    useOutsideClick(wrapperRef, setEdit, columnMetaData);

    const handleCellKeyDown = useCallback((e: KeyboardEvent) => {
        if (cellContext.selectedCellId === props.cellId.selectedCellId) {
            switch (e.key) {
                case "F2":
                    setEdit(true);
                    break;
                default:
                    if (e.key.length === 1) {
                        passRef.current.passKey = e.key;
                        setEdit(true);
                    }
            }
        }
    }, [cellContext.selectedCellId, setEdit])

    useEventHandler(tableContainer, "keydown", (e:any) => handleCellKeyDown(e));


    /** Either return the correctly rendered value or a in-cell editor */
    return (columnMetaData?.cellEditor?.directCellEditor || columnMetaData?.cellEditor?.preferredEditorMode === 1) ?
        ((edit && !waiting) ? 
            <div ref={wrapperRef}>
                {displayEditor(columnMetaData, props, stopCellEditing, passRef.current)}
            </div>
        :
            <div
                className="cell-data"
                onClick={event => {
                    if (columnMetaData?.cellEditor?.className !== "ImageViewer" && !columnMetaData?.cellEditor?.directCellEditor) {
                        setWaiting(true); 
                        setEdit(true);
                    }
                }}>
                {cellRenderer(columnMetaData, props.cellData, props.resource, context.contentStore.locale, () => {setWaiting(true); setEdit(true); passRef.current.click = true})}
            </div>
        ) : (!edit ? 
            <div
                className="cell-data"
                onDoubleClick={event => columnMetaData?.cellEditor?.className !== "ImageViewer" ? setEdit(true) : undefined}>
                {cellRenderer(columnMetaData, props.cellData, props.resource, context.contentStore.locale, () => {setEdit(true)})}
            </div>
            :
            <div ref={wrapperRef}>
                {displayEditor(columnMetaData, props, stopCellEditing, passRef.current)}
            </div>)
}

/**
 * This component displays a DataTable
 * @param baseProps - Initial properties sent by the server for this component
 */
const UITable: FC<TableProps> = (baseProps) => {
    /** Reference for the div wrapping the Table */
    const wrapRef = useRef<HTMLDivElement>(null);

    /** Reference for the Table */
    const tableRef = useRef(null);

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Use context for the positioning, size informations of the layout */
    const layoutContext = useContext(LayoutContext);

    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<TableProps>(baseProps.id, baseProps);

    /** ComponentId of the screen */
    const compId = useMemo(() => context.contentStore.getComponentId(props.id) as string, [context.contentStore, props.id]);

    const metaData = getMetaData(compId, props.dataBook, context.contentStore);

    /** The data provided by the databook */
    const [providerData] = useDataProviderData(compId, props.dataBook);

    /** The amount of virtual rows loaded */
    const rows = 40;

    /** The virtual rows filled with data */
    const [virtualRows, setVirtualRows] = useState(providerData.slice(0, rows));

    /** The current firstRow displayed in the table */
    const firstRowIndex = useRef(0);

    /** Virtual scrolling is enabled (lazy loading), if the provided data is greater than 2 times the row value*/
    const virtualEnabled = useMemo(() => {
        return providerData.length > rows * 2
    }, [providerData.length]);

    /** The current sort-definitions */
    const [sortDefinitions] = useSortDefinitions(compId, props.dataBook);

    const [columnOrder, setColumnOrder] = useState<string[]>(metaData!.columnView_table_);

    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataBook, undefined, true);

    const pageKeyPressed = useRef<boolean>(false);

    const lastSelectedRowIndex = useRef<number|undefined>(selectedRow ? selectedRow.index : undefined)

    const primaryKeys = metaData?.primaryKeyColumns || ["ID"];

    const [selectedCellId, setSelectedCellId] = useState<ISelectedCell>({selectedCellId: "notSet"});

    const sendSelectRequest = useCallback(async (selectedColumn?:string, filter?:SelectFilter) => {
        const selectReq = createSelectRowRequest();
        selectReq.dataProvider = props.dataBook;
        selectReq.componentId = props.name;
        if (selectedColumn) selectReq.selectedColumn = selectedColumn;
        if (filter) selectReq.filter = filter;
        await context.server.sendRequest(selectReq, filter ? REQUEST_ENDPOINTS.SELECT_ROW : REQUEST_ENDPOINTS.SELECT_COLUMN, undefined, undefined, true);
    }, [props.dataBook, props.name, context.server])

    const tableSelect = useCallback((multi:boolean, noVirtualSelector?:string, virtualSelector?:string) => {
        if (tableRef.current) {
            if (multi) {
                //@ts-ignore
                return !virtualEnabled ? tableRef.current.table.querySelectorAll(noVirtualSelector) : tableRef.current.container.querySelectorAll(virtualSelector);
            }

            //@ts-ignore
            return !virtualEnabled ? tableRef.current.table.querySelector(noVirtualSelector) : tableRef.current.container.querySelector(virtualSelector);
        }
    },[virtualEnabled]);

    const getNumberOfRowsPerPage = () => {
        //TODO: In the future with custom styles it's possible that the header or row height could have another height!
        return Math.ceil((layoutContext.get(baseProps.id)?.height as number - 41) / 44)
    }

    const isVisible = (ele:HTMLElement, container:HTMLElement, cell:any) => {
        if (ele) {
            const eleLeft = ele.offsetLeft;
            const eleRight = eleLeft + ele.clientWidth;
        
            const containerLeft = container.scrollLeft;
            const containerRight = containerLeft + container.clientWidth;
    
            const eleTop = cell.rowIndex * 35;
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

    const scrollToSelectedCell = (cell:any, isNext:boolean) => {
        setTimeout(() => {
            const selectedElem = tableSelect(false, 'tbody > tr.p-highlight td.p-highlight', '.p-datatable-scrollable-body-table > .p-datatable-tbody > tr.p-highlight td.p-highlight');
            //@ts-ignore
            const container = tableRef.current.container.querySelector(!virtualEnabled ? '.p-datatable-wrapper' : '.p-datatable-scrollable-body');
            //@ts-ignore
            const loadingTable = tableRef.current.container.querySelector('.p-datatable-loading-virtual-table')
            
            if (!loadingTable || window.getComputedStyle(loadingTable).getPropertyValue("display") !== "table") {
                const moveDirections = isVisible(selectedElem, container, cell);
                if (pageKeyPressed.current !== false) {
                    pageKeyPressed.current = false;
                    container.scrollTo(selectedElem ? selectedElem.offsetLeft : 0, cell.rowIndex * 35)
                }
                else if (selectedElem !== null) {
                    let sLeft:number = container.scrollLeft
                    let sTop:number = container.scrollTop

                    if (moveDirections.visLeft !== CellVisibility.FULL_VISIBLE) {
                        sLeft = selectedElem.offsetLeft;
                    }

                    if (moveDirections.visTop === CellVisibility.NOT_VISIBLE) {
                        sTop = cell.rowIndex * 35;
                    }
                    else if (moveDirections.visTop === CellVisibility.PART_VISIBLE) {
                        sTop = container.scrollTop + (isNext ? 35 : -35);
                    }

                    container.scrollTo(sLeft, sTop);
                }
                else {
                    container.scrollTo(container.scrollLeft, cell.rowIndex * 35);
                }
            }
        }, 0)
    }

    /** Creates and returns the selectedCell object */
    const selectedCell = useMemo(() => {
        if (selectedRow) {
            if (selectedRow.selectedColumn) {
                const newCell = {
                    cellIndex: columnOrder.findIndex(column => column === selectedRow.selectedColumn),
                    field: selectedRow.selectedColumn,
                    rowData: selectedRow.data,
                    rowIndex: selectedRow.index,
                    value: selectedRow.data[selectedRow.selectedColumn]
                }
                setSelectedCellId({selectedCellId: props.id + "-" + newCell.rowIndex!.toString() + "-" + newCell.cellIndex.toString()});
                scrollToSelectedCell(newCell, lastSelectedRowIndex.current !== undefined ? lastSelectedRowIndex.current < selectedRow.index : false);
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

    const enterNavigationMode = props.enterNavigationMode || Navigation.NAVIGATION_CELL_AND_FOCUS;

    const tabNavigationMode = props.tabNavigationMode || Navigation.NAVIGATION_CELL_AND_FOCUS;

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps



    /**
     * Returns the next sort mode
     * @param mode - the current sort mode
     * @returns the next sort mode
     */
    const getNextSort = (mode?: "Ascending" | "Descending" | "None") => {
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

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useEffect(() => {
        if(wrapRef.current){
            if(onLoadCallback) {
                if (props.preferredSize) {
                    sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback)
                }
                else {
                    /** If the provided data is more than 10, send a fixed height if less, calculate the height */
                    const prefSize:Dimension = {height: providerData.length < 10 ? providerData.length*35 + (props.tableHeaderVisible !== false ? 42 : 2) : 410, width: estTableWidth+4}
                    sendOnLoadCallback(id, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback)
                }  
            }    
        }
    }, [id, onLoadCallback, props.preferredSize, providerData.length, props.maximumSize, props.minimumSize, estTableWidth, props.tableHeaderVisible]);

    /** Determine the estimated width of the table */
    useLayoutEffect(() => {
        if (tableRef.current) {
            let cellDataWidthList:Array<number> = [];
            /** Goes through the rows and their cellData and sets the widest value for each column in a list */
            const goThroughCellData = (trows: any, index: number) => {
                const cellDatas: NodeListOf<HTMLElement> = trows[index].querySelectorAll("td > .cell-data");
                for (let j = 0; j < cellDatas.length; j++) {
                    /** disable auto table layout it needs to be enabled later for column resizing */
                    cellDatas[j].style.setProperty('display', 'inline-block');
                    let tempWidth: number;
                    if (cellDatas[j] !== undefined) {
                        /** If it is a Linked- or DateCellEditor add 70 pixel to its measured width to display the editor properly*/
                        if (cellDatas[j].parentElement?.classList.contains('LinkedCellEditor') || cellDatas[j].parentElement?.classList.contains('DateCellEditor'))
                            tempWidth = cellDatas[j].getBoundingClientRect().width + 30;
                        /** Add 32 pixel to its measured width to display editor properly */
                        else
                            tempWidth = cellDatas[j].getBoundingClientRect().width;

                        /** If the measured width is greater than the current widest width for the column, replace it */
                        if (tempWidth > cellDataWidthList[j]) {
                            cellDataWidthList[j] = tempWidth;
                        }
                            
                    }
                    /** remove inline block */
                    cellDatas[j].style.removeProperty('display')
                }
            }

            /** If there is no lazy loading */
            //@ts-ignore
            if (tableRef.current.table) {
                //@ts-ignore
                const theader = tableRef.current.table.querySelectorAll('th');
                //@ts-ignore
                const trows = tableRef.current.table.querySelectorAll('th, tbody > tr');

                
                /** First set width of headers for columns then rows */
                for (let i = 0; i < theader.length; i++) {
                    cellDataWidthList[i] = theader[i].querySelector('.p-column-title').getBoundingClientRect().width + 34;
                }
                    
                for (let i = 0; i < (trows.length < 20 ? trows.length : 20); i++) {
                    goThroughCellData(trows, i);
                }

                let tempWidth: number = 0;
                cellDataWidthList.forEach(cellDataWidth => {
                    tempWidth += cellDataWidth
                });
                
                /** After finding the correct width set the width for the headers, the rows will get as wide as headers */
                for (let i = 0; i < theader.length; i++) {
                    theader[i].style.setProperty('width',`${100 * cellDataWidthList[i] / tempWidth}%`);
                }
                    

                /** set EstTableWidth for size reporting */
                setEstTableWidth(tempWidth);
            }
            /** If there is lazyloading do the same thing as above but set width not only for header but for column groups and header */
            else {
                //@ts-ignore
                const theader = tableRef.current.container.querySelectorAll('.p-datatable-scrollable-header-table th');
                //@ts-ignore
                const tColGroup = tableRef.current.container.querySelectorAll('.p-datatable-scrollable-body-table > colgroup');
                const tCols1 = tColGroup[0].querySelectorAll('col');
                const tCols2 = tColGroup[1].querySelectorAll('col');
                for (let i = 0; i < theader.length; i++)
                    cellDataWidthList[i] = theader[i].querySelector('.p-column-title').getBoundingClientRect().width + 34;
                //@ts-ignore
                const trows = tableRef.current.container.querySelectorAll('.p-datatable-scrollable-body-table > .p-datatable-tbody > tr');
                for (let i = 0; i < 20; i++)
                    goThroughCellData(trows, i)

                let tempWidth:number = 0;
                cellDataWidthList.forEach(cellDataWidth => {
                    tempWidth += cellDataWidth
                });

                for (let i = 0; i < theader.length; i++) {
                    theader[i].style.setProperty('width', `${100 * cellDataWidthList[i] / tempWidth}%`);
                    tCols1[i].style.setProperty('width', `${100 * cellDataWidthList[i] / tempWidth}%`);
                    tCols2[i].style.setProperty('width', `${100 * cellDataWidthList[i] / tempWidth}%`);
                }

                setEstTableWidth(tempWidth)
            }
        }
    },[]);

    /** When providerData changes set state of virtual rows*/
    useLayoutEffect(() => setVirtualRows(providerData.slice(firstRowIndex.current, firstRowIndex.current+(rows*2))), [providerData]);

    useEffect(() => {
        const allTableColumns = tableSelect(true, "th", ".p-datatable-scrollable-header-table th");
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
    }, [sortDefinitions, tableSelect]);

    useEffect(() => {
            const selectedTds = tableSelect(true, 'tbody > tr:not(.p-highlight) td.p-highlight', '.p-datatable-scrollable-body-table > .p-datatable-tbody > tr:not(.p-highlight) td.p-highlight');
            if (selectedTds) {
                for (const elem of selectedTds) {
                    elem.classList.remove("p-highlight");
                }
            }

            const highlightedRow = tableSelect(false, 'tbody > tr.p-highlight', '.p-datatable-scrollable-body-table > .p-datatable-tbody > tr.p-highlight');
            if (selectedRow) {
                const colIdx = columnOrder.findIndex(col => col === selectedRow.selectedColumn);
                if (highlightedRow && colIdx >= 0 && !highlightedRow.children[colIdx].classList.contains(".p-highlight")) {
                    highlightedRow.children[colIdx].classList.add("p-highlight");
                }
            }
    }, [virtualRows, selectedRow, columnOrder, tableSelect]);

    const selectNextCell = useCallback(async (delegateFocus:boolean) => {
        if (selectedRow !== undefined) {
            const newSelectedColumnIndex = columnOrder.findIndex(column => column === selectedRow.selectedColumn) + 1;
            if (newSelectedColumnIndex < columnOrder.length) {
                const newSelectedColumn = columnOrder[newSelectedColumnIndex];
                await sendSelectRequest(newSelectedColumn);
            }
            else if (delegateFocus) {
                focusComponent(props.name, true);
            }
        }
        else if (delegateFocus) {
            focusComponent(props.name, true);
        }
    }, [selectedRow, columnOrder, sendSelectRequest])

    const selectPreviousCell = useCallback(async (delegateFocus:boolean) => {
        if (selectedRow !== undefined) {
            const newSelectedColumnIndex = columnOrder.findIndex(column => column === selectedRow.selectedColumn) - 1;
            if (newSelectedColumnIndex >= 0) {
                const newSelectedColumn = columnOrder[newSelectedColumnIndex];
                await sendSelectRequest(newSelectedColumn);
            }
            else if (delegateFocus) {
                focusComponent(props.name, false);
            }
        }
        else if (delegateFocus) {
            focusComponent(props.name, false);
        }
    }, [selectedRow, columnOrder, sendSelectRequest])

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
                focusComponent(props.name, true);
            }
        }
        else if (delegateFocus) {
            focusComponent(props.name, true);
        }
    }, [selectedRow, primaryKeys, providerData, sendSelectRequest])

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
                focusComponent(props.name, false);
            }
        }
        else if (delegateFocus) {
            focusComponent(props.name, false);
        }
    }, [selectedRow, primaryKeys, providerData, sendSelectRequest])

    const selectNextCellAndRow =  useCallback(async (delegateFocus:boolean) => {
        if (selectedRow !== undefined) {
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
                focusComponent(props.name, true);
            }
        }
        else if (delegateFocus) {
            focusComponent(props.name, true);
        }
    }, [selectedRow, primaryKeys, columnOrder, providerData, sendSelectRequest])

    const selectPreviousCellAndRow = useCallback(async (delegateFocus:boolean) => {
        if (selectedRow !== undefined) {
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
                focusComponent(props.name, false);
            }
        }
        else if (delegateFocus) {
            focusComponent(props.name, false);
        }
    }, [selectedRow, primaryKeys, columnOrder, providerData, sendSelectRequest])

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
                focusComponent(props.name, true);
            }
        }
    }

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
                focusComponent(props.name, false);
            }
        }
    }

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
                    {props.columnLabels[colIndex] + (metaData?.columns.find(column => column.name === colName)?.nullable ? "" : " *")}
                    <span className="p-sortable-column-icon pi pi-fw"></span>
                    <span className="sort-index">{sortIndex}</span>
                </>)
        }

        return props.columnNames.map((colName, colIndex) => {
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
                body={(rowData: any, tableInfo: any) => <CellEditor
                    pk={_.pick(rowData, primaryKeys)}
                    compId={compId}
                    name={props.name as string}
                    colName={colName}
                    dataProvider={props.dataBook}
                    cellData={rowData[colName]}
                    metaData={metaData}
                    resource={context.server.RESOURCE_URL}
                    cellId={{ selectedCellId: props.id + "-" + tableInfo.rowIndex.toString() + "-" + colIndex.toString() }}
                    tableContainer={wrapRef.current ? wrapRef.current : undefined}
                    selectNext={(navigationMode:Navigation) => selectNext.current && selectNext.current(navigationMode)}
                    selectPrevious={(navigationMode:Navigation) => selectPrevious.current && selectPrevious.current(navigationMode)}
                    enterNavigationMode={enterNavigationMode}
                    tabNavigationMode={tabNavigationMode}
                    selectedRow={selectedRow}
                    className={metaData?.columns.find(column => column.name === colName)?.cellEditor?.className}
                />
                }
                style={{ whiteSpace: 'nowrap', lineHeight: '14px' }}
                className={metaData?.columns.find(column => column.name === colName)?.cellEditor?.className}
                loadingBody={() => <div className="loading-text" style={{ height: 30 }} />}
            />
        })
    },[props.columnNames, props.columnLabels, props.dataBook, context.contentStore, props.id, 
       context.server.RESOURCE_URL, props.name, compId, props.tableHeaderVisible, sortDefinitions,
       enterNavigationMode, tabNavigationMode, metaData, primaryKeys, columnOrder, selectedRow])

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
    const handleVirtualScroll = (e: {first: number, rows: number}) => {
        const slicedProviderData = providerData.slice(e.first, e.first+e.rows);
        const isAllFetched = context.contentStore.dataProviderFetched.get(compId)?.get(props.dataBook);
        firstRowIndex.current = e.first;
        if((providerData.length < e.first+(e.rows*2)) && !isAllFetched) {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = props.dataBook;
            fetchReq.fromRow = providerData.length;
            fetchReq.rowCount = e.rows*4;
            context.server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH);
        } else {
            setVirtualRows(slicedProviderData);
        }
    }

    /**
     *  When column-resizing stops, enable pointer-events for sorting, and adjust the width of resize
     *  @param e - the event
     */
    const handleColResizeEnd = (e:any) => {
        e.element.style.setProperty('pointer-events', 'auto')
        if (tableRef.current) {
            //@ts-ignore
            if (!tableRef.current.table) {
                //@ts-ignore
                const theader = tableRef.current.container.querySelectorAll('.p-datatable-scrollable-header-table th');
                //@ts-ignore
                const tColGroupHeader = tableRef.current.container.querySelector('.p-datatable-scrollable-header-table > colgroup');
                //@ts-ignore
                const tColGroup = tableRef.current.container.querySelectorAll('.p-datatable-scrollable-body-table > colgroup');
                const tCols1 = tColGroup[0].querySelectorAll('col');
                const tCols2 = tColGroup[1].querySelectorAll('col');
                const width = tColGroup[0].offsetWidth;
                for (let i = 0; i < tCols1.length; i++) {
                    const w = 100 * tCols1[i].offsetWidth / width;
                    theader[i].style.setProperty('width', `${w}%`)
                    tCols1[i].style.setProperty('width', `${w}%`)
                    tCols2[i].style.setProperty('width', `${w}%`)
                    tColGroupHeader.children[i].style.setProperty('width', `${w}%`)
                }
            }
        }
    }

    /**
     * When columns are reordered, set the column order.
     * @param e - the event
     */
    const handleColReorder = (e:any) => {
        setColumnOrder(e.columns.map((column:any) => column.props.field));
    }

    useLayoutEffect(() => {
        if (tableRef.current) {
            //@ts-ignore
            if (!tableRef.current.table) {
                //@ts-ignore
                const theader = tableRef.current.container.querySelectorAll('.p-datatable-scrollable-header-table th');
                //@ts-ignore
                const tColGroupHeader = tableRef.current.container.querySelector('.p-datatable-scrollable-header-table > colgroup');
                //@ts-ignore
                const tColGroup = tableRef.current.container.querySelectorAll('.p-datatable-scrollable-body-table > colgroup');
                const tCols1 = tColGroup[0].querySelectorAll('col');
                const tCols2 = tColGroup[1].querySelectorAll('col');
                for (let i = 0; i < tCols1.length; i++) {
                    const w = theader[i].style.getPropertyValue('width');
                    tCols1[i].style.setProperty('width', w)
                    tCols2[i].style.setProperty('width', w)
                    tColGroupHeader.children[i].style.setProperty('width', w)
                }
            }
        }
    }, [columnOrder])

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
                    context.server.sendRequest(insertReq, REQUEST_ENDPOINTS.INSERT_RECORD);
                }
                break;
            case "Delete":
                if (metaData?.deleteEnabled) {
                    context.contentStore.deleteDataProviderData(compId, props.dataBook);
                    const selectReq = createSelectRowRequest();
                    selectReq.dataProvider = props.dataBook;
                    selectReq.componentId = props.name;
                    context.server.sendRequest(selectReq, REQUEST_ENDPOINTS.DELETE_RECORD)
                }
        }
    }

    /**
     * Sends a sort request to the server
     * @param e - the mouse event
     */
    const handleSort = (e:MouseEvent) => {
        if (e.target instanceof Element) {
            const clickedCol = e.target.closest("th");
            if (clickedCol) {
                let sortColumnName = window.getComputedStyle(clickedCol).getPropertyValue('--columnName');
                const sortDef = sortDefinitions?.find(sortDef => sortDef.columnName === sortColumnName);
                const sortReq = createSortRequest();
                sortReq.dataProvider = props.dataBook;
                let sortDefToSend:SortDefinition[] = sortDefinitions || [];
                if (e.ctrlKey) {
                    if (!sortDef) {
                        sortDefToSend.push({columnName: sortColumnName, mode:"Ascending"})
                    }
                    else {
                        sortDefToSend[sortDefToSend.findIndex(sortDef => sortDef.columnName === sortColumnName)] = {columnName: sortColumnName, mode: getNextSort(sortDef?.mode)}
                    }
                }
                else {
                    sortDefToSend = [{columnName: sortColumnName, mode: getNextSort(sortDef?.mode)}]
                }
                sortReq.sortDefinition = sortDefToSend;
                context.server.sendRequest(sortReq, REQUEST_ENDPOINTS.SORT);
            }
        }
        
    }

    /**
     * When columns are resized disable pointer events, so when resize smaller sort is not called.
     * @param elem - the element
     */
    const handleColResizeStart = (elem:Element) => {
        elem.parentElement?.style.setProperty('pointer-events', 'none')
    }

    /** Sort handler */
    useMultipleEventHandler(
        tableRef.current ? tableSelect(true, "th", ".p-datatable-scrollable-header-table th") : undefined,
        'click',
        (e:any) => handleSort(e)
    );

    /** Column-resize handler */
    useMultipleEventHandler(
        tableRef.current ?
        //@ts-ignore
            tableRef.current.container.getElementsByClassName("p-column-resizer")
            : undefined,
        'mousedown',
        handleColResizeStart,
        true
    )

    //to subtract header Height
    //TODO: In the future with custom styles it's possible that the header could have another height! Replace 35 then.
    const heightNoHeaders = (layoutContext.get(baseProps.id)?.height as number - 41).toString() + "px" || undefined;

    return (
        <SelectedCellContext.Provider value={selectedCellId}>
            <div
                ref={wrapRef}
                style={{
                    ...layoutContext.get(props.id),
                    height: layoutContext.get(props.id)?.height as number - 2,
                    width: layoutContext.get(props.id)?.width as number - 2,
                    outline: "none"
                }}
                tabIndex={0}
                onKeyDown={(e) => handleTableKeys(e)}
            >
                <DataTable
                    id={props.name}
                    ref={tableRef}
                    className={concatClassnames(
                        "rc-table",
                        props.autoResize === false ? "no-auto-resize" : ""
                    )}
                    value={virtualRows}
                    selection={selectedCell}
                    selectionMode="single"
                    cellSelection
                    scrollHeight={heightNoHeaders}
                    scrollable={virtualEnabled}
                    lazy={virtualEnabled}
                    virtualScroll={virtualEnabled}
                    rows={rows}
                    totalRecords={providerData.length}
                    virtualRowHeight={35}
                    resizableColumns
                    columnResizeMode={props.autoResize !== false ? "fit" : "expand"}
                    reorderableColumns
                    onSelectionChange={handleRowSelection}
                    onVirtualScroll={handleVirtualScroll}
                    onColumnResizeEnd={handleColResizeEnd}
                    onColReorder={handleColReorder}
                    rowClassName={(data) => {
                        let cn: any = {}
                        if (selectedRow && selectedRow.data === data) {
                            cn["p-highlight"] = true;
                        }
                        return cn
                    }}
                    tabIndex={props.tabIndex}>
                    {columns}
                </DataTable>
            </div>
        </SelectedCellContext.Provider>
    )
}
export default UITable