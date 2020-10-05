import React, { useEffect, useContext, useState, useRef, useMemo } from 'react';
import './UITable.scss'

import { RefContext } from '../../helper/Context';
import { createEditor } from "../../factories/ComponentFactory";

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getPreferredSize } from '../../helper/GetSizes';
import useFetchListen from '../../hooks/useFetchListen'
import { toPx } from '../../helper/ToPx';

function UITable(props) {
    const con = useContext(RefContext);
    const rows = 50
    const [fetchedData] = useFetchListen(props.dataBook);
    const [firstRow, setFirstRow] = useState(0);
    const [lastRow, setLastRow] = useState(rows*2);
    // eslint-disable-next-line
    const data = useMemo(() => con.contentStore.storedData.get(props.dataBook).slice(firstRow, lastRow) || [], [fetchedData, con.contentStore, props.dataBook, firstRow, lastRow] );
    // eslint-disable-next-line
    const totalRecords = useMemo(() => con.contentStore.storedData.get(props.dataBook).length || 0, [fetchedData, con.contentStore, props.dataBook]);

    const buildColumns = (labels, names) => {
        let tempDataColumns = [];
        for (let index = 0; index < labels.length; index++) {
            let columnProps = {
                field: names[index],
                header: labels[index],
                key: names[index]
            };
            let metaData = con.contentStore.metaData.get(props.dataBook).columns.get(names[index]);
            if (metaData) {
                metaData.name = props.name;
                metaData.cellEditor.clearColumns = ["ID", names[index]];
                columnProps.editor = (props) => buildEditor(props, metaData);
            }
            tempDataColumns.push(<Column loadingBody={() => {return <span className="loading-text"/>}} {...columnProps} sortable/>);
        }
        return tempDataColumns
    };
    // eslint-disable-next-line
    const dataColumns= useMemo(() => buildColumns(props.columnLabels, props.columnNames), [props.columnLabels, props.columnNames])
    const [firstRender, setFirstRender] = useState(true)
    const [scrollHeight, setScrollHeight] = useState('400px')
    //let test = '400px'
    const tableRef = useRef();

    useEffect(() => {
        const tableScrollHeight = (ref) => {
            if (ref) {
                if (!firstRender) {
                    let elem = ref.container;
                    console.log(Math.ceil(elem.getBoundingClientRect().height), Math.ceil(elem.getElementsByClassName('p-datatable-header')[0].getBoundingClientRect().height), Math.ceil(elem.getElementsByClassName('p-datatable-scrollable-header')[0].getBoundingClientRect().height)-1, elem)
                    setScrollHeight(toPx(Math.ceil(elem.getBoundingClientRect().height) - 
                                    Math.ceil(elem.getElementsByClassName('p-datatable-header')[0].getBoundingClientRect().height) -
                                    Math.ceil(elem.getElementsByClassName('p-datatable-scrollable-header')[0].getBoundingClientRect().height)-1));
                }
            }
        }
        tableScrollHeight(tableRef.current)
        //some tables are first rendered after initial fetches are sent, so useFetch doesn't update and there is no rerender, this rerenders the table at the start
        setFirstRender(false);
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props),
                id: props.id,
                parent: props.parent
            }
        );
    }, [con.contentStore, props, firstRender]);

    

    const buildEditor = (buildProps, data) => {
        if (data) {
            const className = data.cellEditor.className;
            if (className === "LinkedCellEditor") {
                data.appendToBody = true;
            } 
            else if (className === "DateCellEditor") {
                data.appendToBody = true;
            }
            data["cellEditor.editable"] = true;
            data.columnName = buildProps.field;
            data.initialValue = buildProps.rowData[buildProps.field];
            data.rowId = buildProps.rowData["ID"]
            data.dataRow = props.dataBook;
            return createEditor(data);
        } 
        else {
            return undefined;
        }
    }

    const onSelectChange = async event => {
        const value = event.data;
        con.contentStore.emitChangeOfSelectedRow(value);
        con.serverComm.selectRow(props.name, props.dataBook, value)
    }

    const onVirtualScroll = async event => {
        let rowDiff = (con.contentStore.storedData.get(props.dataBook).length - 1) - (event.first + event.rows)
        console.log(event.rows, rows, event.first)
        if (event.first + event.rows >= con.contentStore.storedData.get(props.dataBook).length - 1) {
            if (!fetchedData.isAllFetched) {
                con.serverComm.fetchDataFromProvider(props.dataBook, con.contentStore.storedData.get(props.dataBook).length, 100)
            }
            setFirstRow(event.first);
            setLastRow(event.first+event.rows);
        }
        else if (rowDiff >= 0 && rowDiff < rows) {
            if (!fetchedData.isAllFetched) {
                con.serverComm.fetchDataFromProvider(props.dataBook, con.contentStore.storedData.get(props.dataBook).length, 100)
            }
            setFirstRow(event.first);
            setLastRow(event.first+event.rows);
        }
        else {
            setFirstRow(event.first);
            setLastRow(event.first+event.rows);
        }
    }

    // if (document.getElementById(props.id)) {
    //     console.log(document.getElementById(props.id).getBoundingClientRect().height, document.getElementById(props.id).getElementsByClassName('p-datatable-header')[0].getBoundingClientRect().height, document.getElementById(props.id).getElementsByClassName('p-datatable-scrollable-header')[0].getBoundingClientRect().height)
    // }

    return (
        <DataTable
            id={props.id}
            ref={tableRef}
            header="Table"
            value={data ? data : []}
            onRowDoubleClick={onSelectChange}
            resizableColumns
            columnResizeMode={"expand"}
            scrollable
            lazy
            rows={rows}
            totalRecords={totalRecords}
            scrollHeight={scrollHeight}
            virtualScroll={totalRecords > rows*2 ? true : false}
            onVirtualScroll={onVirtualScroll}
            style={props.layoutStyle}>
            {dataColumns}
        </DataTable>
    );
}
export default UITable;