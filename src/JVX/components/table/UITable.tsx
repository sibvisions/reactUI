import React, {FC, useContext, useLayoutEffect, useMemo, useRef} from "react"
import BaseComponent from "../BaseComponent";
import useProperties from "../zhooks/useProperties";
import {CellProps, Column, useTable} from "react-table";
import useDataProviderData from "../zhooks/useDataProviderData";

import "./UITable.css";
import {LayoutContext} from "../../LayoutContext";
import {createSelectRowRequest} from "../../factories/RequestFactory";
import {jvxContext} from "../../jvxProvider";
import REQUEST_ENDPOINTS from "../../request/REQUEST_ENDPOINTS";

export interface TableProps extends BaseComponent{
    classNameComponentRef: string,
    columnLabels: Array<string>,
    columnNames: Array<string>,
    dataBook: string,
}

type CellEditor = {
    cellData: CellProps<any>,
    dataBook: string,
    name: string
}

const UICellEditor: FC<CellEditor> = (props) => {

    const context = useContext(jvxContext);

    const selectedRow = (selectedRow: CellProps<any, any>) => {
        // Select Row Event
        context.contentStore.setSelectedRow(props.dataBook, selectedRow.row.original)
        context.contentStore.emitRowSelect(props.dataBook);
        context.contentStore.dataProviderSelectedRow.set(props.dataBook, selectedRow.row.original);

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

    return(
        <div onClick={event => selectedRow(props.cellData)} style={{padding: 8}}>
            {props.cellData.value}
        </div>
    )
}

const UITable: FC<TableProps> = (baseProps) => {

    //React Hook
    const tableRef = useRef<HTMLTableElement>(null);
    const layoutContext = useContext(LayoutContext);
    const context = useContext(jvxContext);

    //Custom Hooks
    const [props] = useProperties<TableProps>(baseProps.id, baseProps);
    const [providerData] = useDataProviderData(baseProps.id, props.dataBook);


    //Dependent Hooks
    const columns = useMemo<Array<Column<any>>>(() => {

        const columns: Array<Column<any>> = [];

        props.columnLabels.forEach((label, index) => {
            columns.push({
                Header: label,
                accessor: props.columnNames[index],
                Cell: cellData => <UICellEditor cellData={cellData} dataBook={props.dataBook} name={props.name}/>
            });
        });
        return columns
    }, [props.columnNames, props.columnLabels, context.server, props.dataBook, props.name, context.contentStore]);


    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow
    } = useTable({ columns: columns, data: providerData });

    useLayoutEffect(() => {
        if(tableRef.current && !layoutContext.get(props.id)){
            const size = tableRef.current.getBoundingClientRect();
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
                            <th {...column.getHeaderProps()}>{column.render("Header")}</th>
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