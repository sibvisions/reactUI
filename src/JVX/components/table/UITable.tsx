import React, {FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react"
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

        const decideEditor = () => {
            let editor = <div> {props.cellData} </div>
            const columnMetaData = props.metaData?.columns.find(column => column.name === props.colName)

            if(columnMetaData){
                editor = createEditor({
                    ...columnMetaData,
                    dataRow:props.dataProvider,
                    columnName: props.colName,
                    id: "",
                    cellEditor_editable_:true,
                    onSubmit:() => setEdit(false),
                    style: {width: "100%", height:"100%"}
                }) || editor
            }


            return editor
        }

        if (!edit) {
            return (
                <div className={"cellData"} style={{height: 50}} onDoubleClick={event => setEdit(true)}>
                    {props.cellData}
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

    //Report Size
    useLayoutEffect(() => {
        if(wrapRef.current && !layoutContext.get(baseProps.id)){
            const size = wrapRef.current.getBoundingClientRect();
            if(baseProps.onLoadCallback)
                baseProps.onLoadCallback(baseProps.id, size.height, size.width);
        }
    }, [wrapRef, baseProps, layoutContext]);

    useEffect(() => {
        setVirtualRows(providerData.slice(firstRowIndex.current, firstRowIndex.current+(rows*2)))
    }, [providerData])


    const columns = useMemo(() => {

        const metaData = context.contentStore.dataProviderMetaData.get(props.dataBook);

        return props.columnNames.map((colName, colIndex) =>
            <Column
                field={colName}
                header={props.columnLabels[colIndex]}
                body={(rowData: any) => <CellEditor
                    colName={colName}
                    dataProvider={props.dataBook}
                    cellData={rowData[colName]}
                    metaData={metaData}
                />}
                loadingBody={() => <div style={{height: 50}}>Loading</div>}/>
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
        firstRowIndex.current = event.first;
        if(providerData.length < event.first+(event.rows*2)) {
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
    const heightNoHeaders: number = layoutContext.get(baseProps.id)?.height as number - 41 || 0

    return(
       <div ref={wrapRef} style={{width:"min-content", overflow:"hidden" , ...layoutContext.get(baseProps.id)}}>
           <DataTable
               style={{width:"100%", height: "100%"}}
               scrollable lazy virtualScroll
               rows={rows}
               virtualRowHeight={50}
               scrollHeight={heightNoHeaders.toString() + "px"}
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