import React, {
    FC,
    useContext,
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

export interface TableProps extends BaseComponent{
    classNameComponentRef: string,
    columnLabels: Array<string>,
    columnNames: Array<string>,
    dataBook: string,
}

type CellEditor = {
    cellData: any
}


const CellEditor: FC<CellEditor> = (props) => {

    const [edit, setEdit] = useState(false);

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
                    <input value={props.cellData} onBlur={event => setEdit(false)} autoFocus={true}/>
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
    const [selectedIndex, setSelectedIndex] = useState(-1);

    //Custom Hooks
    const [props] = useProperties<TableProps>(baseProps.id, baseProps);
    const [providerData] = useDataProviderData(baseProps.id, props.dataBook);


    //SelectedIndexChange
    useLayoutEffect(() => {
        const handleIndexChange = (index: number) => {
            setSelectedIndex(index)
        };
        context.contentStore.subscribeToRowIndexSelection(props.dataBook, handleIndexChange);
        return () => context.contentStore.unsubscribeFromRowIndexSelection(props.dataBook, handleIndexChange);
    }, [context.contentStore, props.dataBook]);

    //Report Size
    useLayoutEffect(() => {
        if(wrapRef.current && !layoutContext.get(baseProps.id)){
            const size = wrapRef.current.getBoundingClientRect();
            if(baseProps.onLoadCallback)
                baseProps.onLoadCallback(baseProps.id, size.height, size.width);
        }
    }, [wrapRef, baseProps, layoutContext]);



    const columns = useMemo(() => {
        const cellEditor = (rowData: any, colName: string) => {
            return (
                <div style={{height: "100%", width: "100%"}}>
                    <CellEditor cellData={rowData}/>
                </div>
            )
        }

        return props.columnNames.map((colName, colIndex) =>
            <Column field={colName} header={props.columnLabels[colIndex]}
                    body={(rowData: any) => cellEditor(rowData[colName], colName)}/>
        )
    },[props.columnNames, props.columnLabels])


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

    return(
       <div ref={wrapRef} style={{width:"min-content", ...layoutContext.get(baseProps.id)}}>
           <DataTable value={providerData} selectionMode={"single"} onSelectionChange={handleRowSelection}>
               {columns}
           </DataTable>
       </div>
    )
}
export default UITable