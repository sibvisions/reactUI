import React, {FC, useContext, useEffect, useLayoutEffect, useMemo, useRef} from "react"
import BaseComponent from "../BaseComponent";
import useProperties from "../zhooks/useProperties";
import {jvxContext} from "../../jvxProvider";
import {Column, useTable} from "react-table";
import useDataProvider from "../zhooks/useDataProvider";

import "./UITable.css";
import {LayoutContext} from "../../LayoutContext";

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

    //Custom Hooks
    const [props] = useProperties<TableProps>(baseProps.id, baseProps);
    const [providerData] = useDataProvider(baseProps.id, props.dataBook);

    //Dependent
    const columns = useMemo<Array<Column<any>>>(() => {
        const columns: Array<Column<any>> = [];

        props.columnLabels.forEach((label, index) => {
            columns.push({
               Header: label,
               accessor: props.columnNames[index]
            });
        });
        return columns
    }, [props.columnNames, props.columnLabels]);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow
    } = useTable({ columns: columns, data: providerData});

    useLayoutEffect(() => {
        if(tableRef.current){
            const size = tableRef.current.getBoundingClientRect();
            props.onLoadCallback(props.id, size.height, size.width);
        }
    }, [tableRef, props])


    return(
        <table {...getTableProps()} ref={tableRef} style={layoutContext.get(baseProps.id)}>
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
                    <tr {...row.getRowProps()}>
                        {row.cells.map(cell => {
                            return <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                        })}
                    </tr>
                )
            })}
            </tbody>
        </table>
    )
}
export default UITable