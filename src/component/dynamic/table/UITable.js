import React, { useEffect, useContext, useState } from 'react';
import './UITable.scss'

import { RefContext } from '../../helper/Context';
import { createEditor } from "../../factories/ComponentFactory";

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getPreferredSize } from '../../helper/GetSizes';
import useFetchListen from '../../hooks/useFetchListen'

function UITable(props) {
    const [fetchedData] = useFetchListen(props.dataBook);
    const [data, setData] = useState();
    //const [totalRecords, setTotalRecords] = useState();
    const [dataColumns, setDataColumns] = useState()
    const con = useContext(RefContext);
    const rows = 20;

    useEffect(() => {
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
                tempDataColumns.push(<Column loadingBody={loadingText} {...columnProps} sortable/>);
            }
            setDataColumns(tempDataColumns)
        };
        buildColumns(props.columnLabels, props.columnNames);
        
        // let data = con.contentStore.storedData.get(props.dataBook);
        // if (data) {
        //     buildData(data);
        // }
        //setTotalRecords(con.contentStore.storedData.get(props.dataBook).length)
        setData(con.contentStore.storedData.get(props.dataBook).slice(0, rows*2))
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props),
                id: props.id,
                parent: props.parent
            }
        );
        // eslint-disable-next-line
    }, [con, props, fetchedData]);

    const buildData = async data => {
        let tempArray = []
        data.forEach(set => {
            tempArray.push(set);
        });
        setData(tempArray);
    }

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

    const loadChunk = (index, length) => {
        let chunk = [];
        for (let i = 0; i < length; i++) {
            chunk[i] = {...con.contentStore.storedData.get(props.dataBook)[i+index]}
        }
        return chunk
    }

    const onVirtualScroll = event => {
        setTimeout(() => {
            if (event.first + event.rows >= con.contentStore.storedData.get(props.dataBook).length) {
                con.serverComm.fetchDataFromProvider(props.dataBook, con.contentStore.storedData.get(props.dataBook).length-1, 101)
                buildData(loadChunk(event.first, event.rows))
            }
            else {
                buildData(loadChunk(event.first, event.rows))
            }
        }, 250)
    }

    const loadingText = () => {
        return <span className="loading-text"/>
    }

    return (
        <DataTable
            id={props.id}
            header="Table"
            value={data ? data : []}
            onRowDoubleClick={onSelectChange}
            resizableColumns
            columnResizeMode={"expand"}
            scrollable
            lazy
            rows={rows}
            //totalRecords={totalRecords}
            scrollHeight="400px"
            //virtualScroll
            //onVirtualScroll={onVirtualScroll}
            style={props.layoutStyle}>
            {dataColumns}
        </DataTable>
    );
}
export default UITable;