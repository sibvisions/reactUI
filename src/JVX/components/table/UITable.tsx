import React, {
    FC,
    useContext, useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState
} from "react"
import BaseComponent from "../BaseComponent";
import useProperties from "../zhooks/useProperties";
import useDataProviderData from "../zhooks/useDataProviderData";

import "./UITable.css";
import {LayoutContext} from "../../LayoutContext";
import {jvxContext} from "../../jvxProvider";
import {Column} from "primereact/column";
import {DataTable} from "primereact/datatable";
import {createSelectRowRequest} from "../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../request/REQUEST_ENDPOINTS";
import useRowSelect from "../zhooks/useRowSelect";
import {createEditor, createEditorText} from "../../factories/UIFactory";
import {IEditor} from "../editors/IEditor";
import {first} from "rxjs/operators";
import {root} from "rxjs/internal-compatibility";

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
}


const CellEditor: FC<CellEditor> = (props) => {

    const [edit, setEdit] = useState(false);

    const decideEditor = () => {
        const editorProps: IEditor = {
            name: "none",
            id: "none",
            constraints: "",
            "cellEditor.editable": true,
            dataRow: props.dataProvider,
            columnName: props.colName,
            enabled: true,
            className:"",
            style: {width:"100%", height:"100%"},
            onSubmit: () => {setEdit(false)}
        }
        return createEditorText(editorProps)
    }

    const display = useMemo(() =>{
        if(!edit) {
            return (
                <div className={"cellData"} style={{height: "100%"}} onDoubleClick={event => setEdit(true)}>
                    {props.cellData}
                </div>
            )
        } else {
            return (
                <div>
                    {decideEditor()}
                </div>
            )
        }
    }, [edit, props.cellData]);


    return display;
}



const UITable: FC<TableProps> = (baseProps) => {

    //React Hook
    const wrapRef = useRef<HTMLDivElement>(null);
    const layoutContext = useContext(LayoutContext);
    const context = useContext(jvxContext);
    const [virtualRows, setVirtualRows] = useState(new Array<any>())


    //Custom Hooks
    const [props] = useProperties<TableProps>(baseProps.id, baseProps);
    const [providerData] = useDataProviderData(baseProps.id, props.dataBook);
    const [selectedRow] = useRowSelect(props.dataBook);

    //Report Size
    useLayoutEffect(() => {
        if(wrapRef.current && !layoutContext.get(baseProps.id)){
            const size = wrapRef.current.getBoundingClientRect();
            if(baseProps.onLoadCallback)
                baseProps.onLoadCallback(baseProps.id, size.height, size.width);
        }
    }, [wrapRef, baseProps, layoutContext]);

    useEffect(() => {
        setVirtualRows(providerData.slice(0, 40))
    }, [providerData])




    const columns = useMemo(() => {
        const cellEditor = (rowData: any, colName: string) => {
            return (
                <div style={{height: "100%", width: "100%"}}>
                    <CellEditor cellData={rowData} dataProvider={props.dataBook} colName={colName}/>
                </div>
            )
        }

        return props.columnNames.map((colName, colIndex) =>
            <Column field={colName} header={props.columnLabels[colIndex]}
                    body={(rowData: any) => cellEditor(rowData[colName], colName)}
                    loadingBody={() => <div style={{height: 50}}>Loading</div>}/>
        )
    },[props.columnNames, props.columnLabels, props.dataBook])

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
        setVirtualRows(providerData.slice(event.first, event.first+event.rows));
    }

    //to subtract header Height
    const heightNoHeaders: number = layoutContext.get(baseProps.id)?.height as number - 41 || 0
    console.log(heightNoHeaders, props.dataBook)

    return(
       <div ref={wrapRef} style={{width:"min-content", overflow:"hidden" , ...layoutContext.get(baseProps.id)}}>
           <DataTable
               style={{width:"100%", height: "100%"}}
               scrollable lazy virtualScroll
               rows={20}
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