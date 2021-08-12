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
         useEventHandler,
         useLayoutValue,
         useFetchMissingData,
         useMouseListener} from "../zhooks";

/** Other imports */
import BaseComponent from "../BaseComponent";
import { appContext } from "../../AppProvider";
import { createFetchRequest, createInsertRecordRequest, createSelectRowRequest, createSortRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS, SortDefinition, SelectFilter } from "../../request";
import { MetaDataResponse } from "../../response";
import { getMetaData, parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, Dimension, concatClassnames, focusComponent } from "../util";
import { cellRenderer, displayEditor } from "./CellDisplaying";
import { createEditor } from "../../factories/UIFactory";
import { showTopBar, TopBarContext } from "../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../util/SendFocusRequests";


export interface CellFormatting {
    foreground?: string;
    background?: string;
    font?: string;
    image?: string;
}

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
    enabled?: boolean
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
    cellId: Function,
    tableContainer?: any,
    selectNext: Function,
    selectPrevious: Function,
    enterNavigationMode: number,
    tabNavigationMode: number,
    selectedRow: any,
    className?: string,
    readonly?: boolean,
    tableEnabled?: boolean
    cellFormatting?: CellFormatting;
}

/** Interface for selected cells */
interface ISelectedCell {
    selectedCellId?:string
}

/** A Context which contains the currently selected cell */
export const SelectedCellContext = createContext<ISelectedCell>({})

export const getColMetaData = (colName:string, metaData?:MetaDataResponse) => {
    return metaData?.columns.find(column => column.name === colName);
}

/**
 * This component displays either just the value of the cell or an in-cell editor
 * @param props - props received by Table
 */
const CellEditor: FC<CellEditor> = (props) => {
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
    const columnMetaData = getColMetaData(props.colName, props.metaData);

    /** State if the CellEditor is currently waiting for the selectedRow */
    const [waiting, setWaiting] = useState<boolean>(false);

    const showDropDownArrow = useCallback(() => {
        if (columnMetaData?.cellEditor.className === "LinkedCellEditor"
            || columnMetaData?.cellEditor.className === "DateCellEditor") {
            return true;
        }
        return false;
    }, [columnMetaData])

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
    }, [props.selectedRow, edit])

    /** Whenn the selected cell changes and the editor is editable close it */
    useEffect(() => {
        if (cellContext.selectedCellId !== props.cellId().selectedCellId) {
            if (edit) {
                setEdit(false);
            }
        }
    }, [cellContext.selectedCellId]);

    /**
     * Callback for stopping the cell editing process, closes editor and based on keyboard input, selects the next or previous cell/row
     * @param event - the KeyboardEvent
     */
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
    }, [cellContext.selectedCellId, setEdit])

    /** Adds Keylistener to the tableContainer */
    useEventHandler(tableContainer, "keydown", (e:any) => handleCellKeyDown(e));

    const cellStyle:any = { };

    if (props.cellFormatting) {
        if(props.cellFormatting.background) {
            cellStyle.backgroundColor = props.cellFormatting.background;
        }
        if(props.cellFormatting.foreground) {
            cellStyle.color = props.cellFormatting.foreground;
        }
    }

    /** Either return the correctly rendered value or a in-cell editor when readonly is true don't display an editor*/
    return (
        (!props.readonly && props.tableEnabled !== false) ?
            (columnMetaData?.cellEditor?.directCellEditor || columnMetaData?.cellEditor?.preferredEditorMode === 1) ?
                ((edit && !waiting) ?
                    <div ref={wrapperRef}>
                        {displayEditor(columnMetaData, props, stopCellEditing, passRef.current)}
                    </div>
                    :
                    <div
                        style={cellStyle}
                        className="cell-data"
                        onClick={() => {
                            if (columnMetaData?.cellEditor?.className !== "ImageViewer" && !columnMetaData?.cellEditor?.directCellEditor) {
                                setWaiting(true);
                                setEdit(true);
                            }
                        }}>
                        {cellRenderer(columnMetaData, props.cellData, props.resource, context.appSettings.locale, () => { setWaiting(true); setEdit(true) })}
                        {showDropDownArrow() && <i className="pi pi-chevron-down cell-editor-arrow" style={{ float: "right" }} />}
                    </div>
                ) : (!edit ?
                    <div
                        style={cellStyle}
                        className="cell-data"
                        onDoubleClick={() => columnMetaData?.cellEditor?.className !== "ImageViewer" ? setEdit(true) : undefined}>
                        {cellRenderer(columnMetaData, props.cellData, props.resource, context.appSettings.locale, () => setEdit(true))}
                        {showDropDownArrow() &&
                            <div style={{ float: "right" }} tabIndex={-1} onClick={() => { setWaiting(true); setEdit(true) }} >
                                <i
                                    style={{
                                        visibility: (props.selectedRow && props.selectedRow.index === parseInt(props.cellId().selectedCellId.split('-')[1])) ?
                                            "visible" : "hidden"
                                    }}
                                    className="pi pi-chevron-down cell-editor-arrow"
                                />
                            </div>}
                    </div>
                    :
                    <div ref={wrapperRef}>
                        {displayEditor(columnMetaData, props, stopCellEditing, passRef.current)}
                    </div>)
            : <div
                style={cellStyle}
                className="cell-data">
                {cellRenderer(columnMetaData, props.cellData, props.resource, context.appSettings.locale)}
                {showDropDownArrow() && <i className="pi pi-chevron-down cell-editor-arrow" style={{ float: "right" }} />}
            </div>
    )
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

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<TableProps>(baseProps.id, baseProps);

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id);

    /** ComponentId of the screen */
    const compId = useMemo(() => context.contentStore.getComponentId(props.id) as string, [context.contentStore, props.id]);

    /** Metadata of the databook */
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

    /** The current order of the columns */
    const [columnOrder, setColumnOrder] = useState<string[]|undefined>(metaData?.columnView_table_);

    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataBook, undefined, true);

    /** Reference if the page up/down key was pressed */
    const pageKeyPressed = useRef<boolean>(false);

    /** Reference of the last selected row used for scrolling */
    const lastSelectedRowIndex = useRef<number|undefined>(selectedRow ? selectedRow.index : undefined)

    /** The primary keys of a table */
    const primaryKeys = metaData?.primaryKeyColumns || ["ID"];

    /** The selected cell */
    const [selectedCellId, setSelectedCellId] = useState<ISelectedCell>({selectedCellId: "notSet"});

    useFetchMissingData(compId, props.dataBook);

    /** Hook for MouseListener */
    useMouseListener(props.name, wrapRef.current ? wrapRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

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
        await showTopBar(context.server.sendRequest(selectReq, filter ? REQUEST_ENDPOINTS.SELECT_ROW : REQUEST_ENDPOINTS.SELECT_COLUMN, undefined, undefined, true), topbar);
    }, [props.dataBook, props.name, context.server])

    const tableSelect = useCallback((multi:boolean, noVirtualSelector?:string, virtualSelector?:string) => {
        if (tableRef.current) {
            if (multi) {
                //@ts-ignore
                return !virtualEnabled ? tableRef.current.container.querySelectorAll(noVirtualSelector) : tableRef.current.container.querySelectorAll(virtualSelector);
            }
            //@ts-ignore
            return !virtualEnabled ? tableRef.current.table.querySelector(noVirtualSelector) : tableRef.current.container.querySelector(virtualSelector);
        }
    },[virtualEnabled]);

    /**
     * Returns the number of records visible based on row height.
     * @returns the number of records visible based on row height.
     */
    const getNumberOfRowsPerPage = () => {
        //TODO: In the future with custom styles it's possible that the header or row height could have another height!
        return Math.ceil((layoutStyle?.height as number - 41) / 44)
    }

    /**
     * Helper function to see if the next element in a container is fully or partly visible
     * @param ele - the element which needs to be checked
     * @param container - the container of the element
     * @param cell  - the current cell
     * @returns if the element is fully or partly visible
     */
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

    /**
     * Scrolls the table to the selected cell
     * @param cell - the selected cell
     * @param isNext - if the new selected cell is below or above the previous
     */
    const scrollToSelectedCell = (cell:any, isNext:boolean) => {
        setTimeout(() => {
            if (tableRef.current) {
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

    /** The navigation-mode for the enter key sent by the server default: cell and focus */
    const enterNavigationMode = props.enterNavigationMode || Navigation.NAVIGATION_CELL_AND_FOCUS;

    /** The navigation-mode for the tab key sent by the server default: cell and focus */
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
            let cellDataWidthList:Array<{widthPreSet:boolean, width:number}> = [];
            /** Goes through the rows and their cellData and sets the widest value for each column in a list */
            const goThroughCellData = (trows: any, index: number) => {
                const cellDatas: NodeListOf<HTMLElement> = trows[index].querySelectorAll("td > *");
                for (let j = 0; j < cellDatas.length; j++) {
                    if (!cellDataWidthList[j].widthPreSet) {
                        let tempWidth: number;
                        if (cellDatas[j] !== undefined) {
                            /** If it is a Linked- or DateCellEditor add 70 pixel to its measured width to display the editor properly*/
                            if (cellDatas[j].parentElement?.classList.contains('LinkedCellEditor') || cellDatas[j].parentElement?.classList.contains('DateCellEditor'))
                                tempWidth = cellDatas[j].getBoundingClientRect().width + 30;
                            /** Add 32 pixel to its measured width to display editor properly */
                            else
                                tempWidth = cellDatas[j].getBoundingClientRect().width;
    
                            /** If the measured width is greater than the current widest width for the column, replace it */
                            if (tempWidth > cellDataWidthList[j].width) {
                                cellDataWidthList[j].width = tempWidth;
                            } 
                        }
                    }
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
                    const newCellWidth = {widthPreSet: false, width: 0}
                    const colName = window.getComputedStyle(theader[i]).getPropertyValue('--columnName');
                    const columnMetaData = getColMetaData(colName, metaData)
                    if (columnMetaData?.width) {
                        newCellWidth.width = columnMetaData.width;
                        newCellWidth.widthPreSet = true
                    }
                    else {
                        newCellWidth.width = theader[i].querySelector('.p-column-title').getBoundingClientRect().width + 34;
                    }
                    cellDataWidthList.push(newCellWidth);
                }
                    
                (tableRef.current as any).container.classList.add("read-size");
                for (let i = 0; i < Math.min(trows.length, 100); i++) {
                    goThroughCellData(trows, i);
                }
                (tableRef.current as any).container.classList.remove("read-size");

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
            /** If there is lazyloading do the same thing as above but set width not only for header but for column groups and header */
            else {
                //@ts-ignore
                const theader = tableRef.current.container.querySelectorAll('.p-datatable-scrollable-header-table th');
                //@ts-ignore
                const tColGroup = tableRef.current.container.querySelectorAll('.p-datatable-scrollable-body-table > colgroup');
                const tCols1 = tColGroup[0].querySelectorAll('col');
                const tCols2 = tColGroup[1].querySelectorAll('col');
                for (let i = 0; i < theader.length; i++) {
                    const newCellWidth = {widthPreSet: false, width: 0}
                    const colName = window.getComputedStyle(theader[i]).getPropertyValue('--columnName');
                    const columnMetaData = getColMetaData(colName, metaData)
                    if (columnMetaData?.width) {
                        newCellWidth.width = columnMetaData.width;
                        newCellWidth.widthPreSet = true
                    }
                    else {
                        newCellWidth.width = theader[i].querySelector('.p-column-title').getBoundingClientRect().width + 34;
                    }
                    cellDataWidthList.push(newCellWidth);
                }
                //@ts-ignore
                const trows = tableRef.current.container.querySelectorAll('.p-datatable-scrollable-body-table > .p-datatable-tbody > tr');
                (tableRef.current as any).container.classList.add("read-size");
                for (let i = 0; i < Math.min(trows.length, 100); i++) {
                    goThroughCellData(trows, i)
                }
                (tableRef.current as any).container.classList.remove("read-size");

                let tempWidth:number = 0;
                cellDataWidthList.forEach(cellDataWidth => {
                    tempWidth += cellDataWidth.width
                });

                for (let i = 0; i < theader.length; i++) {
                    let w = cellDataWidthList[i].width as any;
                    if (props.autoResize === false) {
                        w = `${w}px`;
                    } else {
                        w = `${100 * w / tempWidth}%`;
                    }
                    theader[i].style.setProperty('width', w);
                    tCols1[i].style.setProperty('width', w);
                    tCols2[i].style.setProperty('width', w);
                }
                setEstTableWidth(tempWidth)
            }
        }
    },[]);

    useLayoutEffect(() => {
        if (tableRef.current) {
            //@ts-ignore
            const colResizers = tableRef.current.container.getElementsByClassName("p-column-resizer");
            for (const colResizer of colResizers) {
                if (colResizer.parentElement.classList.contains("not-resizable")) {
                    colResizer.style.setProperty("display", "none");
                }
            }
        }
    },[])

    /** When providerData changes set state of virtual rows*/
    useLayoutEffect(() => setVirtualRows(providerData.slice(firstRowIndex.current, firstRowIndex.current+(rows*2))), [providerData]);

    /** Adds the sort classnames to the headers for styling */
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

    /** Removes the highlight classname from the previous selected cell and adds it to the current, needed because PrimeReact selection with virtual tables doesn't work properly */
    useEffect(() => {
            const selectedTds = tableSelect(true, 'tbody > tr td.p-highlight', '.p-datatable-scrollable-body-table > .p-datatable-tbody > tr td.p-highlight');
            if (selectedTds) {
                for (const elem of selectedTds) {
                    elem.classList.remove("p-highlight");
                }
            }

            const highlightedRow = tableSelect(false, 'tbody > tr.p-highlight', '.p-datatable-scrollable-body-table > .p-datatable-tbody > tr.p-highlight');
            if (selectedRow && columnOrder) {
                const colIdx = columnOrder.findIndex(col => col === selectedRow.selectedColumn);
                if (highlightedRow && colIdx >= 0 && !highlightedRow.children[colIdx].classList.contains(".p-highlight")) {
                    highlightedRow.children[colIdx].classList.add("p-highlight");
                }
            }
    }, [virtualRows, selectedRow, columnOrder, tableSelect]);

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
                focusComponent(props.name, true);
            }
        }
        else if (delegateFocus) {
            focusComponent(props.name, true);
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
                focusComponent(props.name, false);
            }
        }
        else if (delegateFocus) {
            focusComponent(props.name, false);
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
                focusComponent(props.name, true);
            }
        }
        else if (delegateFocus) {
            focusComponent(props.name, true);
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
                focusComponent(props.name, false);
            }
        }
        else if (delegateFocus) {
            focusComponent(props.name, false);
        }
    }, [selectedRow, primaryKeys, providerData, sendSelectRequest])

    /**
     * Selects the next cell, if there is no cell anymore select the next row and so on. If there is no more cells/rows and delegateFocus is true, focus the next component
     * @param delegateFocus - true if the next component should be focused if there are no more cells/rows
     */
    const selectNextCellAndRow =  useCallback(async (delegateFocus:boolean) => {
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
                focusComponent(props.name, true);
            }
        }
        else if (delegateFocus) {
            focusComponent(props.name, true);
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
                focusComponent(props.name, false);
            }
        }
        else if (delegateFocus) {
            focusComponent(props.name, false);
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
                focusComponent(props.name, true);
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
                focusComponent(props.name, false);
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
                    if (columnMetaData?.cellEditor.directCellEditor) {
                        return createEditor({
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
                            readonly: columnMetaData?.readonly
                        })
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
                            metaData={metaData}
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
                            tableEnabled={props.enabled} />
                    }
                }
                }
                style={{ whiteSpace: 'nowrap', lineHeight: '14px' }}
                className={concatClassnames(
                    className,
                    !columnMetaData?.sortable ? "not-sortable" : "",
                    !columnMetaData?.resizable ? "not-resizable" : ""
                )}
                loadingBody={() => <div className="loading-text" style={{ height: 30 }} />}
                reorderable={columnMetaData?.movable}
                sortable
            />
        })
    }, [props.columnNames, props.columnLabels, props.dataBook, context.contentStore, props.id,
    context.server.RESOURCE_URL, props.name, compId, props.tableHeaderVisible, sortDefinitions,
        enterNavigationMode, tabNavigationMode, metaData, primaryKeys, columnOrder, selectedRow, providerData])

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
            showTopBar(context.server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH), topbar);
        } else {
            setVirtualRows(slicedProviderData);
        }
    }

    /**
     *  When column-resizing stops, adjust the width of resize
     *  @param e - the event
     */
    const handleColResizeEnd = (e:any) => {
        if (tableRef.current) {
            //@ts-ignore
            const container = tableRef.current.container;
            if (virtualEnabled) {
                const theader = container.querySelectorAll('.p-datatable-scrollable-header-table th');
                const tColGroupHeader = container.querySelector('.p-datatable-scrollable-header-table > colgroup');
                const tColGroup = container.querySelectorAll('.p-datatable-scrollable-body-table > colgroup');
                const tCols1 = tColGroup[0].querySelectorAll('col');
                const tCols2 = tColGroup[1].querySelectorAll('col');
                const width = tColGroup[0].offsetWidth;
                for (let i = 0; i < tCols1.length; i++) {
                    let w = tCols1[i].offsetWidth;
                    if (props.autoResize === false) {
                        w = `${w}px`;
                    } else {
                        w = `${100 * w / width}%`;
                    }
                    theader[i].style.setProperty('width', w)
                    tCols1[i].style.setProperty('width', w)
                    tCols2[i].style.setProperty('width', w)
                    tColGroupHeader.children[i].style.setProperty('width', w)
                    theader[i].style.removeProperty('pointer-events')
                }
                if (props.autoResize === false) {
                container.querySelector('.p-datatable-scrollable-header').style.setProperty("width", `${container.offsetWidth - 2}px`);
                container.querySelector('.p-datatable-scrollable-body').style.setProperty("width", `${container.offsetWidth - 2}px`);
                }
            }
            else {
                const theader = container.querySelectorAll('th');
                //@ts-ignore
                const width = tableRef.current.table.offsetWidth
                for (let i = 0; i < theader.length; i++) {
                    let w = theader[i].offsetWidth;
                    if (props.autoResize === false) {
                        w = `${w}px`;
                    } else {
                        w = `${100 * w / width}%`;
                    }

                    theader[i].style.setProperty('width', w);
                    theader[i].style.removeProperty('pointer-events')
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
            const container = tableRef.current.container;
            if (virtualEnabled) {
                //@ts-ignore
                const theader = container.querySelectorAll('.p-datatable-scrollable-header-table th');
                //@ts-ignore
                const tColGroupHeader = container.querySelector('.p-datatable-scrollable-header-table > colgroup');
                //@ts-ignore
                const tColGroup = container.querySelectorAll('.p-datatable-scrollable-body-table > colgroup');
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
            tableSelect(true, "th", ".p-datatable-scrollable-header-table th")
            : undefined,
        'mousedown',
        (elem:any) => elem instanceof Element ? (elem as HTMLElement).style.setProperty('pointer-events', 'none') : undefined,
        true
    )

    //to subtract header Height
    //TODO: In the future with custom styles it's possible that the header could have another height!
    const heightNoHeaders = (layoutStyle?.height as number - 41).toString() + "px" || undefined;

    const focused = useRef<boolean>(false);

    return (
        <SelectedCellContext.Provider value={selectedCellId}>
            <div
                ref={wrapRef}
                style={{
                    ...layoutStyle,
                    height: layoutStyle?.height as number - 2,
                    width: layoutStyle?.width as number - 2,
                    outline: "none",
                } as any}
                tabIndex={props.tabIndex ? props.tabIndex : 0}
                onFocus={() => {
                    if (!focused.current) {
                        if (props.eventFocusGained) {
                            showTopBar(onFocusGained(props.name, context.server), topbar);
                        }
                        focused.current = true;
                        if (columnOrder) {
                            sendSelectRequest(columnOrder[0]);
                        }
                        
                    }
                }}
                onBlur={event => {
                    if (wrapRef.current && !wrapRef.current.contains(event.relatedTarget as Node)) {
                        if (props.eventFocusLost) {
                            showTopBar(onFocusLost(props.name, context.server), topbar);
                        }
                        focused.current = false;
                    }
                }}
                onKeyDown={(event) => handleTableKeys(event)}
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
                    onSort={(event) => handleSort(event.sortField)}
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