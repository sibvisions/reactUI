import React, {FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react"
import BaseComponent from "../BaseComponent";
import useProperties from "../zhooks/useProperties";
import useDataProviderData from "../zhooks/useDataProviderData";

import "./UITable.scss";
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

export interface TableProps extends BaseComponent{
    classNameComponentRef: string,
    columnLabels: Array<string>,
    columnNames: Array<string>,
    dataBook: string,
}

type CellEditor = {
    cellData: any,
    dataProvider: string,
    colName: string,
    metaData: MetaDataResponse | undefined
}


const CellEditor: FC<CellEditor> = (props) => {

    const [edit, setEdit] = useState(false);
    return useMemo(() => {
        const columnMetaData = props.metaData?.columns.find(column => column.name === props.colName)
        const decideEditor = () => {
            let editor = <div> {props.cellData} </div>

            if(columnMetaData){
                editor = createEditor({
                    ...columnMetaData,
                    dataRow:props.dataProvider,
                    columnName: props.colName,
                    id: "",
                    cellEditor_editable_:true,
                    onSubmit:() => setEdit(false),
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
                    const cellIndex = castedColumn?.cellEditor?.allowedValues?.indexOf(props.cellData)
                    if (castedColumn.cellEditor?.images && cellIndex !== undefined) {
                        return <img alt="choice" style={{cursor: 'pointer'}} src={'http://localhost:8080/JVx.mobile/services/mobile/resource/demo' + castedColumn?.cellEditor?.images[cellIndex]}/>
                    }
                }
                else if (columnMetaData?.cellEditor?.className === "DateCellEditor") {
                    const castedColumn = columnMetaData as IEditorDate;
                    const formattedDate = moment(props.cellData).format(parseDateFormatTable(castedColumn.cellEditor?.dateFormat))
                    if (formattedDate !== "Invalid date") 
                        return formattedDate
                    else
                        return null
                }
                else
                    return props.cellData
            }
            else
                return null
            
        }

        if (!edit) {
            return (
                <div className={"cellData"} style={{height: 50}} onDoubleClick={event => setEdit(true)}>
                    {showCellData()}
                </div>
            )
        } else {
            return (
                <div style={{height: 50}}>
                    {decideEditor()}
                </div>
            )
        }
    }, [edit, props.cellData]);
}

const UITable: FC<TableProps> = (baseProps) => {

    //React Hook
    const wrapRef = useRef<HTMLDivElement>(null);
    const layoutContext = useContext(LayoutContext);
    const context = useContext(jvxContext);

    //Custom Hooks
    const [props] = useProperties<TableProps>(baseProps.id, baseProps);
    const [providerData] = useDataProviderData(baseProps.id, props.dataBook);
    const [selectedRow] = useRowSelect(props.dataBook);

    const rows = 40;
    const [virtualRows, setVirtualRows] = useState(providerData.slice(0, rows));
    const firstRowIndex = useRef(0);

    const {onLoadCallback, id} = baseProps
    //Report Size
    useEffect(() => {
        if(wrapRef.current){
            const size = wrapRef.current.getBoundingClientRect();
            if(onLoadCallback)
                onLoadCallback(id, 400, size.width);
        }
    }, [id, onLoadCallback]);

    useLayoutEffect(() => {
        setVirtualRows(providerData.slice(firstRowIndex.current, firstRowIndex.current+(rows*2)))
    }, [providerData])


    const columns = useMemo(() => {

        const metaData = context.contentStore.dataProviderMetaData.get(props.dataBook);

        return props.columnNames.map((colName, colIndex) =>
            <Column
                field={colName}
                header={props.columnLabels[colIndex]}
                headerStyle={{overflowX: "hidden", textOverflow: 'Ellipsis'}}
                body={(rowData: any, column:any) => <CellEditor
                    colName={colName}
                    dataProvider={props.dataBook}
                    cellData={rowData[colName]}
                    metaData={metaData}
                />}
                className={metaData?.columns.find(column => column.name === colName)?.cellEditor?.className}
                loadingBody={() => <div className="loading-text" style={{height: 50}} />}/>
        )
    },[props.columnNames, props.columnLabels, props.dataBook, context.contentStore])

    const handleRowSelection = (event: {originalEvent: any, value: any}) => {
        const primaryKeys = context.contentStore.dataProviderMetaData.get(props.dataBook)?.primaryKeyColumns || ["ID"];

        const selectReq = createSelectRowRequest();
        selectReq.filter = {
            columnNames: primaryKeys,
            values: primaryKeys.map(pk => event.value[pk])
        }
        selectReq.dataProvider = props.dataBook;
        selectReq.componentId = props.name;
        context.server.sendRequest(selectReq, REQUEST_ENDPOINTS.SELECT_ROW);
    }

    const handleVirtualScroll = (event: {first: number, rows: number}) => {
        const slicedProviderData = providerData.slice(event.first, event.first+event.rows);
        const isAllFetched = context.contentStore.dataProviderFetched.get(props.dataBook);
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

    //to subtract header Height
    const heightNoHeaders = (layoutContext.get(baseProps.id)?.height as number - 41).toString() + "px" || undefined

    return(
       <div ref={wrapRef} style={{width:"min-content", ...layoutContext.get(baseProps.id)}}>
           <DataTable
               style={{width:"100%", height: "100%"}}
               scrollable lazy virtualScroll
               rows={rows}
               virtualRowHeight={50}
               scrollHeight={heightNoHeaders}
               onVirtualScroll={handleVirtualScroll}
               totalRecords={providerData.length}
               value={virtualRows}
               selection={selectedRow}
               selectionMode={"single"}
               onSelectionChange={handleRowSelection}
               >
               {columns}
           </DataTable>
       </div>
    )
}
export default UITable