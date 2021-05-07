/** React imports */
import React, { FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

/** 3rd Party imports */
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import _ from "underscore";

/** Hook imports */
import { useProperties, useDataProviderData, useRowSelect, useOutsideClick } from "../zhooks";

/** Other imports */
import BaseComponent from "../BaseComponent";
import { LayoutContext } from "../../LayoutContext";
import { appContext } from "../../AppProvider";
import { createFetchRequest, createSelectRowRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../request";
import { MetaDataResponse } from "../../response";
import { getMetaData, parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, Dimension } from "../util";
import { cellRenderer, displayEditor } from "./CellDisplaying";


/** Interface for Table */
export interface TableProps extends BaseComponent{
    classNameComponentRef: string,
    columnLabels: Array<string>,
    columnNames: Array<string>,
    dataBook: string,
    tableHeaderVisible?: boolean
    autoResize?: boolean
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

    const [selectedRow] = useRowSelect(props.compId, props.metaData!.dataProvider);

    const [waiting, setWaiting] = useState<boolean>(false);

    useEffect(() => {
        const pickedVals = _.pick(selectedRow, Object.keys(props.pk))
        //console.log(pickedVals, props.pk)
        if (waiting && _.isEqual(pickedVals, props.pk)) {
            setWaiting(false);
        }
    }, [selectedRow, edit])

    /** Hook which detects if there was a click outside of the element (to close editor) */
    useOutsideClick(wrapperRef, setEdit, columnMetaData);
    /** Either return the correctly rendered value or a in-cell editor */

    return (columnMetaData?.cellEditor?.className === "ChoiceCellEditor" || columnMetaData?.cellEditor?.className === "CheckBoxCellEditor") ?
        ((edit && !waiting) ? 
            <div ref={wrapperRef} style={{ height: 30 }}>
                {displayEditor(columnMetaData, props)}
            </div>
        :
            <div
                className="cell-data"
                style={{ height: 30 }}
                onDoubleClick={event => columnMetaData?.cellEditor?.className !== "ImageViewer" ? setEdit(true) : undefined}>
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
    const compId = context.contentStore.getComponentId(props.id) as string;
    /** The data provided by the databook */
    const [providerData] = useDataProviderData(compId, props.dataBook);
    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataBook);
    /** The amount of virtual rows loaded */
    const rows = 40;
    /** The virtual rows filled with data */
    const [virtualRows, setVirtualRows] = useState(providerData.slice(0, rows));
    /** The current firstRow displayed in the table */
    const firstRowIndex = useRef(0);
    /** The estimated table width */
    const [estTableWidth, setEstTableWidth] = useState(0);

    /** Virtual scrolling is enabled (lazy loading), if the provided data is greater than 2 times the row value*/
    const virtualEnabled = useMemo(() => {
        return providerData.length > rows*2
    },[providerData.length])
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps

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
            const goThroughCellData = (trows:any, index:number) => {
                const cellDatas:NodeListOf<HTMLElement> = trows[index].querySelectorAll("td > .cell-data");
                        for (let j = 0; j < cellDatas.length; j++) {
                            /** disable auto table layout it needs to be enabled later for column resizing */
                            cellDatas[j].style.setProperty('display', 'inline-block');
                            let tempWidth:number;
                            if (cellDatas[j] !== undefined) {
                                /** If it is a Linked- or DateCellEditor add 70 pixel to its measured width to display the editor properly*/
                                if (cellDatas[j].parentElement?.classList.contains('LinkedCellEditor') || cellDatas[j].parentElement?.classList.contains('DateCellEditor'))
                                    tempWidth = cellDatas[j].getBoundingClientRect().width + 70;
                            /** Add 32 pixel to its measured width to display editor properly */
                            else
                                tempWidth = cellDatas[j].getBoundingClientRect().width + 32;
                            /** If the measured width is greater than the current widest width for the column, replace it */
                            if (tempWidth > cellDataWidthList[j])
                                cellDataWidthList[j] = tempWidth;
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
                const trows = tableRef.current.table.querySelectorAll('tbody > tr');
                /** First set width of headers for columns then rows */
                for (let i = 0; i < theader.length; i++)
                    cellDataWidthList[i] = theader[i].querySelector('.p-column-title').getBoundingClientRect().width + 34;
                for (let i = 0; i < (trows.length < 20 ? trows.length : 20); i++)
                    goThroughCellData(trows, i);
                /** After finding the correct width set the width for the headers, the rows will get as wide as headers */
                for (let i = 0; i < theader.length; i++)
                    theader[i].style.setProperty('width', cellDataWidthList[i]+  'px');

                let tempWidth:number = 0;
                cellDataWidthList.forEach(cellDataWidth => {
                    tempWidth += cellDataWidth
                });
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
                    cellDataWidthList[i] = theader[i].querySelector('.p-column-title').getBoundingClientRect().width + 29;
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
    },[])

    /** When providerData changes set state of virtual rows*/
    useLayoutEffect(() => setVirtualRows(providerData.slice(firstRowIndex.current, firstRowIndex.current+(rows*2))), [providerData])

    /** When a resized column got smaller, it sometimes interpreted the mouseup as click to sort the column so the pointer-events got disabled while resizing columns */
    useEffect(() => {
        const currTable = tableRef.current;
        const resizeStart = (elem:Element) => {
            elem.parentElement?.style.setProperty('pointer-events', 'none');
        }
        if (currTable) {
            //@ts-ignore
            const resizerCollection:HTMLCollection = currTable.container.getElementsByClassName("p-column-resizer");
            for (let resizer of resizerCollection) {
                resizer.addEventListener('mousedown', () => resizeStart(resizer));
            }
        }
        return () => {
            if (currTable) {
                //@ts-ignore
                const resizerCollection:HTMLCollection = currTable.container.getElementsByClassName("p-column-resizer");
                for (let resizer of resizerCollection) {
                    resizer.removeEventListener('mousedown', () => resizeStart(resizer));
                }
            }
        }
    },[])

    /** Building the columns */
    const columns = useMemo(() => {
        const metaData = getMetaData(compId, props.dataBook, context.contentStore);
        const primaryKeys = metaData?.primaryKeyColumns || ["ID"]

        return props.columnNames.map((colName, colIndex) => {
            return <Column
                field={colName}
                header={props.columnLabels[colIndex] + (metaData?.columns.find(column => column.name === colName)?.nullable ? "" : " *")}
                key={colName}
                headerStyle={{overflowX: "hidden", whiteSpace: 'nowrap', textOverflow: 'Ellipsis', display: props.tableHeaderVisible === false ? 'none' : undefined}}
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
                style={{whiteSpace: 'nowrap', lineHeight: '14px'}}
                className={metaData?.columns.find(column => column.name === colName)?.cellEditor?.className}
                loadingBody={() => <div className="loading-text" style={{height: 30}} />}
                sortable/>
        })
    },[props.columnNames, props.columnLabels, props.dataBook, context.contentStore, context.server.RESOURCE_URL, props.name, compId, props.tableHeaderVisible])

    /** When a row is selected send a selectRow request to the server */
    const handleRowSelection = (event: {originalEvent: any, value: any}) => {
        const primaryKeys = getMetaData(compId, props.dataBook, context.contentStore)?.primaryKeyColumns || ["ID"];
        
        if(event.value){
            const selectReq = createSelectRowRequest();
            selectReq.filter = {
                columnNames: primaryKeys,
                values: primaryKeys.map(pk => event.value[pk])
            }
            selectReq.dataProvider = props.dataBook;
            selectReq.componentId = props.name;
            context.server.sendRequest(selectReq, REQUEST_ENDPOINTS.SELECT_ROW);
        }
    }

    /** 
     * When the virtual scroll occurs, set the firstRow index to the current first row of the virtual scroll and check if more data needs to be loaded,
     * if yes, fetch data, no set virtual rows to the next bunch of datarows
     */
    const handleVirtualScroll = (event: {first: number, rows: number}) => {
        const slicedProviderData = providerData.slice(event.first, event.first+event.rows);
        const isAllFetched = context.contentStore.dataProviderFetched.get(compId)?.get(props.dataBook);
        firstRowIndex.current = event.first;
        if((providerData.length < event.first+(event.rows*2)) && !isAllFetched) {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = props.dataBook;
            fetchReq.fromRow = providerData.length;
            fetchReq.rowCount = event.rows*4;
            context.server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH);
        } else {
            setVirtualRows(slicedProviderData);
        }
    }

    /** When column-resizing stops, enable pointer-events for sorting, and adjust the width of resize */
    const handleColResize = (e:any) => {
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

    //to subtract header Height
    const heightNoHeaders = (layoutContext.get(baseProps.id)?.height as number - 44).toString() + "px" || undefined

    return(
       <div ref={wrapRef} style={{...layoutContext.get(props.id)}}>
           <DataTable
               ref={tableRef}
               onColumnResizeEnd={handleColResize}
               className="rc-table"
               scrollable={virtualEnabled}
               lazy={virtualEnabled}
               virtualScroll={virtualEnabled}
               resizableColumns
               rows={rows}
               virtualRowHeight={30}
               scrollHeight={heightNoHeaders}
               onVirtualScroll={handleVirtualScroll}
               totalRecords={providerData.length}
               value={virtualRows}
               selection={selectedRow}
               selectionMode={"single"}
               onSelectionChange={handleRowSelection}
               removableSort>
               {columns}
           </DataTable>
       </div>
    )
}
export default UITable