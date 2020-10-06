import React, {FC, useContext, useLayoutEffect, useMemo, useRef} from "react"
import BaseComponent from "../BaseComponent";
import useProperties from "../zhooks/useProperties";
import {CellPropGetter, CellProps, Column, useTable} from "react-table";
import useDataProvider from "../zhooks/useDataProvider";

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

const UITable: FC<TableProps> = (baseProps) => {

    //React Hook
    const tableRef = useRef<HTMLTableElement>(null);
    const layoutContext = useContext(LayoutContext);
    const context = useContext(jvxContext);

    //Custom Hooks
    const [props] = useProperties<TableProps>(baseProps.id, baseProps);
    const [providerData] = useDataProvider(baseProps.id, props.dataBook);




    //Dependent Hooks
    const columns = useMemo<Array<Column<any>>>(() => {
        const selectedRow = (selectedRow: CellProps<any, any>) => {
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
                Cell: cellData => <div onClick={event => selectedRow(cellData)}> {cellData.value} </div>
            });
        });
        return columns
    }, [props.columnNames, props.columnLabels, context.server, props.dataBook, props.name]);
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow
    } = useTable({ columns: columns, data: providerData });

    useLayoutEffect(() => {
        if(tableRef.current){
            const size = tableRef.current.getBoundingClientRect();
            props.onLoadCallback(props.id, size.height, size.width);
        }
        }, [tableRef, props])


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