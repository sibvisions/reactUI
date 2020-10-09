import React, {FC, useContext, useLayoutEffect, useMemo, useRef, useState} from "react"
import BaseComponent from "../BaseComponent";
import useProperties from "../zhooks/useProperties";
import {CellProps, Column, useTable} from "react-table";
import useDataProviderData from "../zhooks/useDataProviderData";

import "./UITable.css";
import {LayoutContext} from "../../LayoutContext";
import {createSelectRowRequest} from "../../factories/RequestFactory";
import {jvxContext} from "../../jvxProvider";
import REQUEST_ENDPOINTS from "../../request/REQUEST_ENDPOINTS";
import CellEditorText from "./inCellEditors/CellEditorText";

type CellEditor = {
    cellData: CellProps<any>,
    onRowSelect: Function,
    dataProvider: string,
    columnName: string
    name: string
}

export interface TableProps extends BaseComponent{
    classNameComponentRef: string,
    columnLabels: Array<string>,
    columnNames: Array<string>,
    dataBook: string,
}

const UICellEditor: FC<CellEditor> = (props) => {

    const [edit, setEdit] = useState(false);
    const editor = useMemo(() => {
        const makeEditor = () => {
            const handleBlur = () => {
                setEdit(false)
            }

            return <CellEditorText
                onBlur={handleBlur}
                name={props.name}
                dataProvider={props.dataProvider}
                text={props.cellData.value}
                columnName={props.columnName}
            />
        }

        if(!edit){
            return (
                <div
                    onClick={event => props.onRowSelect(props.cellData)}
                    onDoubleClick={event => setEdit(true)}
                    style={{width: "100%", height:"100%"}}
                >
                    {props.cellData.value}
                </div>
            )
        } else {
            return(
                <div>
                    {makeEditor()}
                </div>
            )
        }
    }, [edit, props])

    return(
        <div style={{padding: 8 ,width: "100%", height:"100%"}}>
            {editor}
        </div>
    )
}

const UITable: FC<TableProps> = (baseProps) => {

    //React Hook
    const tableRef = useRef<HTMLTableElement>(null);
    const alreadySelected = useRef<any>();
    const layoutContext = useContext(LayoutContext);
    const context = useContext(jvxContext);

    //Custom Hooks
    const [props] = useProperties<TableProps>(baseProps.id, baseProps);
    const [providerData] = useDataProviderData(baseProps.id, props.dataBook);




    //Dependent Hooks
    const columns = useMemo<Array<Column<any>>>(() => {

        const handleRowSelect = (selectedRow: CellProps<any, any>) => {
            if(alreadySelected.current === selectedRow.row.original)
                return;

            // Select Row Event
            alreadySelected.current = selectedRow.row.original;
            context.contentStore.setSelectedRow(props.dataBook, selectedRow.row.original);
            context.contentStore.emitRowSelect(props.dataBook);

            // Select Row Request
            const selectRowReq = createSelectRowRequest();
            selectRowReq.dataProvider = props.dataBook;
            selectRowReq.componentId = props.name;
            selectRowReq.filter = {
                columnNames: ["ID"],
                values: [selectedRow.row.original.ID]
            }
            context.server.sendRequest(selectRowReq, REQUEST_ENDPOINTS.SELECT_ROW);
        }

        const columns: Array<Column<any>> = [];

        props.columnLabels.forEach((label, index) => {
            columns.push({
                Header: label,
                accessor: props.columnNames[index],
                Cell: cellData => <UICellEditor
                    dataProvider={props.dataBook}
                    onRowSelect={handleRowSelect}
                    cellData={cellData}
                    columnName={props.columnNames[index]}
                    name={props.name}
                />
            });
        });
        return columns
    }, [props.columnNames, props.columnLabels, context.server, props.dataBook, props.name, context.contentStore]);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns: columns, data: providerData });

    useLayoutEffect(() => {
        if(tableRef.current && !layoutContext.get(props.id)){
            const size = tableRef.current.getBoundingClientRect();
            if(props.onLoadCallback)
                props.onLoadCallback(props.id, size.height, size.width);
        }
    }, [tableRef, props, layoutContext])


    return(
        <div style={{...layoutContext.get(baseProps.id) }}>
            <table {...getTableProps()} ref={tableRef} style={layoutContext.get(baseProps.id) ? { width: "100%"}: {}}>
                <thead>
                {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map(column => (
                            <th {...column.getHeaderProps()}><h3>{column.render("Header")}</h3></th>
                        ))}
                    </tr>
                ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                {rows.map((row) => {
                    prepareRow(row);
                    return (
                        <tr {...row.getRowProps()} >
                            {row.cells.map(cell => {
                                return <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                            })}
                        </tr>
                    )
                })}
                </tbody>
            </table>
        </div>
    )
}
export default UITable