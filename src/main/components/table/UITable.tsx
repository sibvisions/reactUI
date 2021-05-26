/** React imports */
import React, { FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

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
         useCellSelect, 
         useEventHandler} from "../zhooks";

/** Other imports */
import BaseComponent from "../BaseComponent";
import { LayoutContext } from "../../LayoutContext";
import { appContext } from "../../AppProvider";
import { createFetchRequest, createSelectRowRequest, createSortRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS, SortDefinition, SelectFilter } from "../../request";
import { MetaDataResponse } from "../../response";
import { getMetaData, parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, Dimension, concatClassnames } from "../util";
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

/** Type for CellEditor */
type CellEditor = {
    pk: any
    compId: string
    name: string
    cellData: any,
    dataProvider: string,
    colName: string,
    metaData: MetaDataResponse | undefined,
    resource: string
}

/**
 * This component displays either just the value of the cell or an in-cell editor
 * @param props - props received by Table
 */
const CellEditor: FC<CellEditor> = (props) => {
    /** State if editing is currently possible */
    const [edit, setEdit] = useState(false);

    /** Reference for element wrapping the cell value/editor */
    const wrapperRef = useRef(null);

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Metadata of the columns */
    const columnMetaData = props.metaData?.columns.find(column => column.name === props.colName);

    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(props.compId, props.metaData!.dataProvider);

    /** State if the CellEditor is currently waiting for the selectedRow */
    const [waiting, setWaiting] = useState<boolean>(false);

    /** When a new selectedRow is set, set waiting to false */
    useEffect(() => {
        const pickedVals = _.pick(selectedRow, Object.keys(props.pk))
        if (waiting && _.isEqual(pickedVals, props.pk)) {
            setWaiting(false);
        }
    }, [selectedRow, edit])

    /** Hook which detects if there was a click outside of the element (to close editor) */
    useOutsideClick(wrapperRef, setEdit, columnMetaData);

    /** Either return the correctly rendered value or a in-cell editor */
    return (columnMetaData?.cellEditor?.directCellEditor || columnMetaData?.cellEditor?.preferredEditorMode === 1) ?
        ((edit && !waiting) ? 
            <div ref={wrapperRef} style={{ height: 30 }}>
                {displayEditor(columnMetaData, props)}
            </div>
        :
            <div
                className="cell-data"
                style={{ height: 30 }}
                onClick={event => {
                    if (columnMetaData?.cellEditor?.className !== "ImageViewer" && !columnMetaData?.cellEditor?.directCellEditor) {
                        setWaiting(true); 
                        setEdit(true);
                    }
                }}>
                {cellRenderer(columnMetaData, props.cellData, props.resource, context.contentStore.locale, () => {setWaiting(true); setEdit(true)})}
            </div>
        ) : (!edit ? 
            <div
                className="cell-data"
                style={{ height: 30 }}
                onDoubleClick={event => columnMetaData?.cellEditor?.className !== "ImageViewer" ? setEdit(true) : undefined}>
                {cellRenderer(columnMetaData, props.cellData, props.resource, context.contentStore.locale, () => {setEdit(true)})}
            </div>
            :
            <div ref={wrapperRef} style={{ height: 30 }}>
                {displayEditor(columnMetaData, props)}
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

    const [selectedColumn] = useCellSelect(compId, props.dataBook);

    const [columnOrder, setColumnOrder] = useState<string[]>(metaData!.columnView_table_);

    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataBook, undefined, true);

    const primaryKeys = metaData?.primaryKeyColumns || ["ID"];

    const sendSelectRequest = (selectedColumn?:string, filter?:SelectFilter) => {
        const selectReq = createSelectRowRequest();
        selectReq.dataProvider = props.dataBook;
        selectReq.componentId = props.name;
        if (selectedColumn) selectReq.selectedColumn = selectedColumn;
        if (filter) selectReq.filter = filter
        context.server.sendRequest(selectReq, filter ? REQUEST_ENDPOINTS.SELECT_ROW : REQUEST_ENDPOINTS.SELECT_COLUMN);
    }

    const tableSelect = (multi:boolean, noVirtualSelector?:string, virtualSelector?:string) => {
        if (tableRef.current) {
            if (multi) {
                //@ts-ignore
                return !virtualEnabled ? tableRef.current.table.querySelectorAll(noVirtualSelector) : tableRef.current.container.querySelectorAll(virtualSelector);
            }

            //@ts-ignore
            return !virtualEnabled ? tableRef.current.table.querySelector(noVirtualSelector) : tableRef.current.container.querySelector(virtualSelector);
        }
    }

    /** Creates and returns the selectedCell object */
    const selectedCell = useMemo(() => {
        const highlightedRowElement = tableSelect(false, 'tbody > tr.p-highlight', '.p-datatable-scrollable-body-table > .p-datatable-tbody > tr.p-highlight');

        if (highlightedRowElement) {
            highlightedRowElement.classList.remove("p-highlight");
        }
        if (selectedRow) {
            if (selectedColumn) {
                const selectedRowElement = tableSelect(true, 'tbody > tr', '.p-datatable-scrollable-body-table > .p-datatable-tbody > tr')[selectedRow.index - firstRowIndex.current];
                selectedRowElement.classList.add("p-highlight");
                return {
                    cellIndex: columnOrder.findIndex(column => column === selectedColumn),
                    field: selectedColumn,
                    rowData: selectedRow.data,
                    rowIndex: selectedRow.index,
                    value: selectedRow.data[selectedColumn]
                }
            }
            else {
                sendSelectRequest(columnOrder[0]);
            }
        }

        return undefined
    }, [selectedRow, selectedColumn, columnOrder]);

    /** The estimated table width */
    const [estTableWidth, setEstTableWidth] = useState(0);

    const enterNavigationMode = props.enterNavigationMode || Navigation.NAVIGATION_CELL_AND_FOCUS;

    const tabNavigationMode = props.tabNavigationMode || Navigation.NAVIGATION_CELL_AND_FOCUS;

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps

    const getNumberOfRowsPerPage = () => {
        return Math.ceil((layoutContext.get(baseProps.id)?.height as number - 35) / 37)
    }

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
                    const prefSize:Dimension = {height: providerData.length < 10 ? providerData.length*37 + (props.tableHeaderVisible !== false ? 42 : 2) : 410, width: estTableWidth+4}
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
                            tempWidth = cellDatas[j].getBoundingClientRect().width + 24;
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

                setEstTableWidth(tempWidth+17)
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
    }, [sortDefinitions]);

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
                body={(rowData: any) => <CellEditor
                    pk={_.pick(rowData, primaryKeys)}
                    compId={compId}
                    name={props.name as string}
                    colName={colName}
                    dataProvider={props.dataBook}
                    cellData={rowData[colName]}
                    metaData={metaData}
                    resource={context.server.RESOURCE_URL}
                />}
                style={{ whiteSpace: 'nowrap', lineHeight: '14px' }}
                className={metaData?.columns.find(column => column.name === colName)?.cellEditor?.className}
                loadingBody={() => <div className="loading-text" style={{ height: 30 }} />}
            />
        })
    },[props.columnNames, props.columnLabels, props.dataBook, context.contentStore, context.server.RESOURCE_URL, props.name, compId, props.tableHeaderVisible, sortDefinitions])

    /** When a row is selected send a selectRow request to the server */
    const handleRowSelection = (event: {originalEvent: any, value: any}) => {
        if(event.value && event.originalEvent.type === 'click') {
            const isNewRow = selectedRow ? event.value.rowIndex !== selectedRow.index : true;
            let filter:SelectFilter|undefined = undefined
            if (isNewRow) {
                filter = {
                    columnNames: primaryKeys,
                    values: primaryKeys.map(pk => event.value.rowData[pk])
                }
            }
            sendSelectRequest(event.value.field, filter)
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
                const tColGroupHeader = tableRef.current.container.querySelector('.p-datatable-scrollable-header-table > colgroup');
                //@ts-ignore
                const tColGroup = tableRef.current.container.querySelectorAll('.p-datatable-scrollable-body-table > colgroup');
                const tCols1 = tColGroup[0].querySelectorAll('col');
                const tCols2 = tColGroup[1].querySelectorAll('col');
                const width = tColGroup[0].offsetWidth;
                for (let i = 0; i < tCols1.length; i++) {
                    tCols1[i].style.setProperty('width', `${100 * tCols1[i].offsetWidth / width}%`)
                    tCols2[i].style.setProperty('width', `${100 * tCols1[i].offsetWidth / width}%`)
                    tColGroupHeader.children[i].style.setProperty('width', `${100 * tCols1[i].offsetWidth / width}%`)
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

    const handleTableKeys = (e:KeyboardEvent) => {
        switch(e.key) {
            case "Enter":
                if (e.shiftKey) {
                    selectPrevious(enterNavigationMode);
                }
                else {
                    selectNext(enterNavigationMode);
                }
                break;
            case "Tab":
                e.preventDefault();
                if (e.shiftKey) {
                    selectPrevious(tabNavigationMode);
                }
                else {
                    selectNext(tabNavigationMode);
                }
                break;
            case "PageUp":
                e.preventDefault();
                selectPreviousPage(false);
                break;
            case "PageDown":
                e.preventDefault();
                selectNextPage(false);
        }
    }

    const selectNext = (navigationMode:number) => {
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

    const selectPrevious = (navigationMode:number) => {
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

    const focusCellAndRowElements = (next: boolean, row:boolean, page:boolean, navCell:boolean) => {
        const currSelectedCell = tableSelect(
            false, "tbody > tr.p-highlight > td.p-highlight",
            ".p-datatable-scrollable-body-table > .p-datatable-tbody > tr.p-highlight > td.p-highlight"
        );
        let focusable = Array.from(document.querySelectorAll("a, button, input, select, textarea, [tabindex], [contenteditable]")).filter((e: any) => {
            const tabNegative = e.getAttribute("tabindex") && parseInt(e.getAttribute("tabindex")) < 0;
            const isTd = e.tagName === "TD";
            if (e.disabled || (tabNegative && !isTd)) return false
            return true;
        }).sort((a: any, b: any) => {
            return (parseFloat(a.tagName === "TD" ? 0 : a.getAttribute("tabindex") || 99999) || 99999) - (parseFloat(b.tagName === "TD" ? 0 : b.getAttribute("tabindex") || 99999) || 99999);
        });
        focusable = focusable.slice(focusable.findIndex(e => e.tagName === "TD") - 1, _.findLastIndex(focusable, (e) => e.tagName === "TD") + 2);
        let focusIndex = focusable.indexOf(currSelectedCell);

        if (next) {
            if (page) {
                if (selectedRow.index + getNumberOfRowsPerPage() >= providerData.length) {
                    focusIndex = focusable.length - 2; 
                }
                else {
                    focusIndex += getNumberOfRowsPerPage() * columnOrder.length;
                }
                if (virtualEnabled) {
                    //@ts-ignore
                    tableRef.current.container.querySelector(".p-datatable-scrollable-body").scrollTop += getNumberOfRowsPerPage() * 37;
                }
            }
            else if (row) {
                focusIndex += columnOrder.length;
            }
            else {
                if (navCell) {
                    focusIndex = focusable.length - 1;
                }
                else {
                    focusIndex++
                }
            }
        }
        else {
            if (page) {
                if (selectedRow.index - getNumberOfRowsPerPage() < 0) {
                    focusIndex = 1;
                }
                else {
                    focusIndex -= getNumberOfRowsPerPage() * columnOrder.length;
                }
                if (virtualEnabled) {
                    //@ts-ignore
                    tableRef.current.container.querySelector(".p-datatable-scrollable-body").scrollTop -= getNumberOfRowsPerPage() * 37;
                }
            }
            else if (row) {
                focusIndex -= columnOrder.length;
            }
            else {
                if (navCell) {
                    focusIndex = 0;
                }
                else {
                    focusIndex--;
                }
            }
        }
        if (focusable[focusIndex]) (focusable[focusIndex] as HTMLElement).focus();
    }

    const selectNextCell = (delegateFocus:boolean) => {
        const newSelectedColumnIndex = columnOrder.findIndex(column => column === selectedColumn) + 1;
        if (newSelectedColumnIndex < columnOrder.length && selectedRow) {
            focusCellAndRowElements(true, false, false, false);
            const newSelectedColumn = columnOrder[columnOrder.findIndex(column => column === selectedColumn) + 1];
            sendSelectRequest(newSelectedColumn);
        }
        else if (delegateFocus) {
            focusCellAndRowElements(true, false, false, true);
        }
    }

    const selectPreviousCell = (delegateFocus:boolean) => {
        const newSelectedColumnIndex = columnOrder.findIndex(column => column === selectedColumn) - 1;
        if (newSelectedColumnIndex >= 0 && selectedRow) {
            focusCellAndRowElements(false, false, false, false);
            const newSelectedColumn = columnOrder[columnOrder.findIndex(column => column === selectedColumn) - 1];
            sendSelectRequest(newSelectedColumn);
        }
        else if (delegateFocus) {
            focusCellAndRowElements(false, false, false, true);
        }
    }

    const selectNextRow = (delegateFocus:boolean) => {
        const nextSelectedRowIndex = selectedRow.index + 1;
        if (nextSelectedRowIndex < providerData.length) {
            focusCellAndRowElements(true, true, false, false);
            let filter:SelectFilter = {
                columnNames: primaryKeys,
                values: primaryKeys.map(pk => providerData[nextSelectedRowIndex][pk])
            };
            sendSelectRequest(undefined, filter);
        }
        else if (delegateFocus) {
            focusCellAndRowElements(true, false, false, true);
        }
    }

    const selectPreviousRow = (delegateFocus:boolean) => {
        const prevSelectedRowIndex = selectedRow.index - 1;
        if (prevSelectedRowIndex >= 0) {
            focusCellAndRowElements(false, true, false, false);
            let filter:SelectFilter = {
                columnNames: primaryKeys,
                values: primaryKeys.map(pk => providerData[prevSelectedRowIndex][pk])
            };
            sendSelectRequest(undefined, filter);
        }
        else if (delegateFocus) {
            focusCellAndRowElements(false, false, false, true);
        }
    }

    const selectNextCellAndRow = (delegateFocus:boolean) => {
        const newSelectedColumnIndex = columnOrder.findIndex(column => column === selectedColumn) + 1;
        const nextSelectedRowIndex = selectedRow.index + 1;
        if (newSelectedColumnIndex < columnOrder.length && selectedRow) {
            focusCellAndRowElements(true, false, false, false);
            const newSelectedColumn = columnOrder[columnOrder.findIndex(column => column === selectedColumn) + 1];
            sendSelectRequest(newSelectedColumn);
        }
        else if (nextSelectedRowIndex < providerData.length) {
            focusCellAndRowElements(true, false, false, false);
            let filter:SelectFilter = {
                columnNames: primaryKeys,
                values: primaryKeys.map(pk => providerData[nextSelectedRowIndex][pk])
            };
            sendSelectRequest(columnOrder[0], filter);
        }
        else if (delegateFocus) {
            focusCellAndRowElements(true, false, false, true);
        }
    }

    const selectPreviousCellAndRow = (delegateFocus:boolean) => {
        const prevSelectedColumnIndex = columnOrder.findIndex(column => column === selectedColumn) - 1;
        const prevSelectedRowIndex = selectedRow.index - 1;
        if (prevSelectedColumnIndex >= 0 && selectedRow) {
            focusCellAndRowElements(false, false, false, false);
            const newSelectedColumn = columnOrder[columnOrder.findIndex(column => column === selectedColumn) - 1];
            sendSelectRequest(newSelectedColumn);
        }
        else if (prevSelectedRowIndex >= 0) {
            focusCellAndRowElements(false, false, false, false);
            let filter:SelectFilter = {
                columnNames: primaryKeys,
                values: primaryKeys.map(pk => providerData[prevSelectedRowIndex][pk])
            };
            sendSelectRequest(columnOrder[columnOrder.length - 1], filter);
        }
        else if (delegateFocus) {
            focusCellAndRowElements(false, false, false, true);
        }
    }

    const selectNextPage = (delegateFocus: boolean) => {
        let nextSelectedRowIndex = selectedRow.index;
        if (nextSelectedRowIndex < providerData.length - 1) {
            focusCellAndRowElements(true, false, true, false)
            //TODO: In the future with custom styles it's possible that the header or row height could have another height! Replace 35 and 37 then.
            nextSelectedRowIndex += getNumberOfRowsPerPage();
            if (nextSelectedRowIndex >= providerData.length) {
                nextSelectedRowIndex = providerData.length - 1;
            }
            let filter: SelectFilter = {
                columnNames: primaryKeys,
                values: primaryKeys.map(pk => providerData[nextSelectedRowIndex][pk])
            };
            sendSelectRequest(undefined, filter)
        }
        else if (delegateFocus) {
            focusCellAndRowElements(true, false, false, true);
        }
    }

    const selectPreviousPage = (delegateFocus: boolean) => {
        let nextSelectedRowIndex = selectedRow.index;
        if (nextSelectedRowIndex > 0) {
            focusCellAndRowElements(false, false, true, false)
            //TODO: In the future with custom styles it's possible that the header or row height could have another height! Replace 35 and 37 then.
            nextSelectedRowIndex -= getNumberOfRowsPerPage();
            if (nextSelectedRowIndex < 0) {
                nextSelectedRowIndex = 0;
            }
            let filter: SelectFilter = {
                columnNames: primaryKeys,
                values: primaryKeys.map(pk => providerData[nextSelectedRowIndex][pk])
            };
            sendSelectRequest(undefined, filter)
        }
        else if (delegateFocus) {
            focusCellAndRowElements(false, false, false, true);
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

    //@ts-ignore
    useEventHandler(wrapRef.current ? wrapRef.current : undefined, 'keydown', (e:any) => handleTableKeys(e))

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
    const heightNoHeaders = (layoutContext.get(baseProps.id)?.height as number - 35).toString() + "px" || undefined;

    return (
        <div
            ref={wrapRef}
            style={{
                ...layoutContext.get(props.id),
                height: layoutContext.get(props.id)?.height as number - 2,
                width: layoutContext.get(props.id)?.width as number - 2,
                outline: "none"
            }}
            tabIndex={-1}
        >
            <DataTable
                id={id}
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
                virtualRowHeight={37}
                resizableColumns
                columnResizeMode={props.autoResize !== false ? "fit" : "expand"}
                reorderableColumns
                onSelectionChange={handleRowSelection}
                onVirtualScroll={handleVirtualScroll}
                onColumnResizeEnd={handleColResizeEnd}
                onColReorder={handleColReorder}
                tabIndex={props.tabIndex}>
                {columns}
            </DataTable>
        </div>
    )
}
export default UITable