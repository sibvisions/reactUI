import React, { useEffect, useContext, useState, useRef } from 'react';
import './UITable.scss'

import { RefContext } from '../../helper/Context';
import { createEditor } from "../../factories/ComponentFactory";

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getPreferredSize } from '../../helper/GetSizes';
import useFetchListen from '../../hooks/useFetchListen'

function UITable(props) {
    const con = useContext(RefContext);
    //const initalLength = useState(con.contentStore.storedData.get(props.dataBook).length);
    const [data, setData] = useState();
    const [totalRecords, setTotalRecords] = useState();
    const [dataColumns, setDataColumns] = useState();
    const [firstRow, setFirstRow] = useState(0);
    const [lastRow, setLastRow] = useState(con.contentStore.storedData.get(props.dataBook).length);
    const rows = 20
    const [fetchedData] = useFetchListen(props.dataBook);
    const tableRef = useRef();

    useEffect(() => {
        console.log(rows, con.contentStore.storedData.get(props.dataBook).length)
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
            setDataColumns(tempDataColumns)
        };
        buildColumns(props.columnLabels, props.columnNames);

        setTotalRecords(con.contentStore.storedData.get(props.dataBook).length)
        setData(con.contentStore.storedData.get(props.dataBook).slice(firstRow, lastRow))

        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props),
                id: props.id,
                parent: props.parent
            }
        );
        // eslint-disable-next-line
    }, [con, props, fetchedData]);

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

    const loadChunk = async (index, length) => {
        let chunk = [];
        for (let i = 0; i < length; i++) {
            chunk[i] = {...con.contentStore.storedData.get(props.dataBook)[i+index]}
        }
        console.log(chunk)
        return chunk
    }

    const onVirtualScroll = async event => {
        let rowDiff = (con.contentStore.storedData.get(props.dataBook).length - 1) - (event.first + event.rows)
        console.log(event.rows, rows, event.first)
        if (event.first + event.rows >= con.contentStore.storedData.get(props.dataBook).length - 1) {
            con.serverComm.fetchDataFromProvider(props.dataBook, con.contentStore.storedData.get(props.dataBook).length, -2);
            setData(await loadChunk(event.first, con.contentStore.storedData.get(props.dataBook).length - event.first));
            setFirstRow(event.first);
            setLastRow(event.first+event.rows);
        }
        else if (rowDiff >= 0 && rowDiff < rows) {
            console.log('rowdiff')
            console.log(event.first, event.first+event.rows)
            if (!fetchedData.isAllFetched) {
                con.serverComm.fetchDataFromProvider(props.dataBook, con.contentStore.storedData.get(props.dataBook).length, -2)
            }
            setData(await loadChunk((event.first+rowDiff)+1, event.rows))
            setFirstRow(event.first);
            setLastRow(event.first+event.rows);
        }
        else {
            setData(await loadChunk(event.first, event.rows));
            setFirstRow(event.first);
            setLastRow(event.first+event.rows);
        }
    }

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
            scrollHeight="400px"
            virtualScroll
            onVirtualScroll={onVirtualScroll}
            style={props.layoutStyle}>
            {dataColumns}
        </DataTable>
    );
}
export default UITable;