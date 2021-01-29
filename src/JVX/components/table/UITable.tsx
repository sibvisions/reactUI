import React, {FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react"
import BaseComponent from "../BaseComponent";
import useProperties from "../zhooks/useProperties";
import useDataProviderData from "../zhooks/useDataProviderData";

import {LayoutContext} from "../../LayoutContext";
import {jvxContext} from "../../jvxProvider";
import {Column} from "primereact/column";
import {DataTable} from "primereact/datatable";
import {createFetchRequest, createSelectRowRequest} from "../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../request/REQUEST_ENDPOINTS";
import useRowSelect from "../zhooks/useRowSelect";
import {createEditor} from "../../factories/UIFactory";
import MetaDataResponse from "../../response/MetaDataResponse";
import { IEditorChoice } from "../editors/choice/UIEditorChoice";
import { IEditorDate } from "../editors/date/UIEditorDate";
import { parseDateFormatTable } from "../util/ParseDateFormats";
import moment from "moment";
import useOutsideClick from "../zhooks/useOutsideClick";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";
import { parseJVxSize } from "../util/parseJVxSize";
import Size from "../util/Size";

export interface TableProps extends BaseComponent{
    classNameComponentRef: string,
    columnLabels: Array<string>,
    columnNames: Array<string>,
    dataBook: string,
    tableHeaderVisible?: boolean
    autoResize?: boolean
}

type CellEditor = {
    name: string
    cellData: any,
    dataProvider: string,
    colName: string,
    metaData: MetaDataResponse | undefined,
    resource: string
}


const CellEditor: FC<CellEditor> = (props) => {

    const [edit, setEdit] = useState(false);
    const wrapperRef = useRef(null)
    const columnMetaData = props.metaData?.columns.find(column => column.name === props.colName)
    useOutsideClick(wrapperRef, setEdit, columnMetaData)
    return useMemo(() => {
        
        const decideEditor = () => {
            let editor = <div> {props.cellData} </div>

            if(columnMetaData){
                editor = createEditor({
                    ...columnMetaData,
                    name:props.name,
                    dataRow:props.dataProvider,
                    columnName: props.colName,
                    id: "",
                    cellEditor_editable_:true,
                    editorStyle: {width: "100%", height:"100%"},
                    autoFocus: true
                }) || editor
            }
            return editor
        }

        const showCellData = () => {
            if (props.cellData !== undefined) {
                if (columnMetaData?.cellEditor?.className === "ChoiceCellEditor") {
                    const castedColumn = columnMetaData as IEditorChoice;
                    const cellIndex = castedColumn?.cellEditor.allowedValues?.indexOf(props.cellData)
                    if (castedColumn.cellEditor?.imageNames && cellIndex !== undefined) {
                        return <img className="jvx-editor-choice-img" alt="choice" src={props.resource + castedColumn?.cellEditor?.imageNames[cellIndex]}/>
                    }
                }
                else if (columnMetaData?.cellEditor?.className === "DateCellEditor") {
                    const castedColumn = columnMetaData as IEditorDate;
                    const formattedDate = moment(props.cellData).format(parseDateFormatTable(castedColumn.cellEditor?.dateFormat))
                    if (formattedDate !== "Invalid date") 
                        return formattedDate
                    else {
                        return null
                    }
                        
                }
                else
                    return props.cellData
            }
            else
                return null
            
        }

        if (!edit) {
            return (
                <div className={"cell-data"} style={{height: 30}} onDoubleClick={event => setEdit(true)}>
                    {showCellData()}
                </div>
            )
        } else {
            return (
                <div ref={wrapperRef} style={{height: 30}}>
                    {decideEditor()}
                </div>
            )
        }
    }, [edit, props.cellData, props.colName, props.dataProvider, props.resource, props.name, columnMetaData]);
}

const UITable: FC<TableProps> = (baseProps) => {

    //React Hook
    const wrapRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef(null)
    const layoutContext = useContext(LayoutContext);
    const context = useContext(jvxContext);

    //Custom Hooks
    const [props] = useProperties<TableProps>(baseProps.id, baseProps);
    const compId = context.contentStore.getComponentId(props.id) as string
    const [providerData] = useDataProviderData(compId, baseProps.id, props.dataBook);
    const [selectedRow] = useRowSelect(compId, props.dataBook);

    const rows = 40;
    const [virtualRows, setVirtualRows] = useState(providerData.slice(0, rows));
    const firstRowIndex = useRef(0);
    const [estTableWidth, setEstTableWidth] = useState(0);

    const virtualEnabled = useMemo(() => {
        return providerData.length > rows*2
    },[providerData.length])

    const {onLoadCallback, id} = baseProps
    //Report Size
    useEffect(() => {
        if(wrapRef.current){
            if(onLoadCallback) {
                if (props.preferredSize) {
                    sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), undefined, onLoadCallback)
                }
                else {
                    const prefSize:Size = {height: providerData.length < 10 ? providerData.length*37 + (props.tableHeaderVisible !== false ? 42 : 2) : 410, width: estTableWidth+2}
                    sendOnLoadCallback(id, prefSize, parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), undefined, onLoadCallback)
                }
                    
            }
                
        }
    }, [id, onLoadCallback, props.preferredSize, providerData.length, props.maximumSize, props.minimumSize, estTableWidth, props.tableHeaderVisible]);

    useLayoutEffect(() => {
        if (tableRef.current) {
            let cellDataWidthList:Array<number> = [];

            const goThroughCellData = (trows:any, index:number) => {
                const cellDatas:NodeListOf<HTMLElement> = trows[index].querySelectorAll("td > .cell-data");
                        for (let j = 0; j < cellDatas.length; j++) {
                            cellDatas[j].style.setProperty('display', 'inline-block');
                            let tempWidth:number;
                            if (cellDatas[j] !== undefined) {
                                if (cellDatas[j].parentElement?.classList.contains('LinkedCellEditor') || cellDatas[j].parentElement?.classList.contains('DateCellEditor'))
                                    tempWidth = cellDatas[j].getBoundingClientRect().width + 70;
                            else
                                tempWidth = cellDatas[j].getBoundingClientRect().width + 32;
                            if (tempWidth > cellDataWidthList[j])
                                cellDataWidthList[j] = tempWidth;
                            }
                            cellDatas[j].style.removeProperty('display')
                        } 
            }

            //@ts-ignore
            if (tableRef.current.table) {
                //@ts-ignore
                const theader = tableRef.current.table.querySelectorAll('th');
                //@ts-ignore
                const trows = tableRef.current.table.querySelectorAll('tbody > tr');
                for (let i = 0; i < theader.length; i++)
                    cellDataWidthList[i] = theader[i].querySelector('.p-column-title').getBoundingClientRect().width + 34;
                for (let i = 0; i < (trows.length < 20 ? trows.length : 20); i++)
                    goThroughCellData(trows, i);
                 for (let i = 0; i < theader.length; i++)
                    theader[i].style.setProperty('width', cellDataWidthList[i]+  'px');
                 let tempWidth:number = 0;
                 cellDataWidthList.forEach(cellDataWidth => {
                    tempWidth += cellDataWidth
                 });
                 setEstTableWidth(tempWidth)
            }
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
                for (let i = 0; i < theader.length; i++) {
                    theader[i].style.setProperty('width', cellDataWidthList[i] + 'px');
                    tCols1[i].style.setProperty('width', cellDataWidthList[i] + 'px');
                    tCols2[i].style.setProperty('width', cellDataWidthList[i] + 'px');
                }
                let tempWidth:number = 0;
                 cellDataWidthList.forEach(cellDataWidth => {
                    tempWidth += cellDataWidth
                 });
                 setEstTableWidth(tempWidth+17)
            }
        }
    },[])

    useLayoutEffect(() => {
        setVirtualRows(providerData.slice(firstRowIndex.current, firstRowIndex.current+(rows*2)))
    }, [providerData])

    const columns = useMemo(() => {
        const metaData = context.contentStore.dataProviderMetaData.get(compId)?.get(props.dataBook);
        return props.columnNames.map((colName, colIndex) => {
            return <Column
                field={colName}
                header={props.columnLabels[colIndex] + (metaData?.columns.find(column => column.name === colName)?.nullable ? "" : " *")}
                key={colName}
                headerStyle={{overflowX: "hidden", whiteSpace: 'nowrap', textOverflow: 'Ellipsis', display: props.tableHeaderVisible === false ? 'none' : undefined}}
                body={(rowData: any) => <CellEditor
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
        }

        )
    },[props.columnNames, props.columnLabels, props.dataBook, context.contentStore, context.server.RESOURCE_URL, props.name, compId, props.tableHeaderVisible])

    const handleRowSelection = (event: {originalEvent: any, value: any}) => {
        const primaryKeys = context.contentStore.dataProviderMetaData.get(compId)?.get(props.dataBook)?.primaryKeyColumns || ["ID"];

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

    const handleColResize = (e:any) => {
        if (tableRef.current) {
            //@ts-ignore
            if (!tableRef.current.table) {
                //@ts-ignore
                const tColGroup = tableRef.current.container.querySelectorAll('.p-datatable-scrollable-body-table > colgroup');
                const tCols1 = tColGroup[0].querySelectorAll('col');
                const tCols2 = tColGroup[1].querySelectorAll('col');
                for (let i = 0; i < tCols1.length; i++) {
                    tCols2[i].style.setProperty('width', (parseFloat(tCols1[i].style.width) + 8) +'px')
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