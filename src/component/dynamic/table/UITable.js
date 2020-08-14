import React from 'react';
import Base from '../Base';
import './UITable.scss'

import { Size } from '../../helper/Size';
import { RefContext } from '../../helper/Context';
import { createEditor } from "../../factories/ComponentFactory";

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

class UITable extends Base {
    content = [];
    dataColumns = [];
    data;
    state = {  }
    maximumSize = new Size(undefined, undefined, this.props.maximumSize)
    
    componentDidMount(){
        this.fetchSub = this.context.contentStore.fetchCompleted.subscribe(fetchData => {
            if(fetchData.dataProvider === this.props.dataProvider){
                this.buildData(fetchData);
            }
        })
        this.buildColumns(this.props.columnLabels, this.props.columnNames);
        let data = this.context.contentStore.storedData.get(this.props.dataProvider);
        if(data){
            this.buildData(data)
        }
    }

    componentWillUnmount(){
        this.fetchSub.unsubscribe();
    }

    buildColumns(labels, names){
        let faster = 0;
        let differnce = 0;
        let runtime = 0;
        for(let i= 0; i< 700; i++){
            const t1 = performance.now()
            for (let index = 0; index < labels.length; index++){
                let columnProps= {
                    field: names[index],
                    header: labels[index],
                    key: names[index],
                }
                let metaData = this.context.contentStore.metaData.get(names[index]);
                metaData.name = this.props.name;
                metaData.cellEditor.clearColumns = ["ID", names[index]]
                    columnProps.editor = (props) => this.buildEditor(props, metaData)
                this.dataColumns.push(<Column {...columnProps}/>);
            }
            const t2 = performance.now()
            const sync = t2 - t1;
            this.dataColumns.length=0;
            const t3 = performance.now();
            
            for (let index = 0; index < labels.length; index++){
                this.col(labels[index], names[index]);
            }
            const t4 = performance.now();
            const asyncD = t4 - t3
            runtime += (sync + asyncD)/2
            differnce += sync - asyncD
            if(sync - asyncD > 0){
                faster++
            }
        }
        console.log("async was: " + ((faster/700)*100) + "% often faster.  Average difference : " + (differnce/700) + " Average Runtime: " + (runtime/700));
    }

    async col(label, name){
        let columnProps= {
            field: name,
            header: label,
            key: name,
        }
        let metaData = this.context.contentStore.metaData.get(name);
        metaData.name = this.props.name;
        metaData.cellEditor.clearColumns = ["ID", name]
            columnProps.editor = (props) => this.buildEditor(props, metaData)
        this.dataColumns.push(<Column {...columnProps}/>);
    }


    buildEditor(props, data){
        if(data){
            const className = data.cellEditor.className;
            if(className === "LinkedCellEditor"){
                data.appendToBody = true
            } else if(className === "DateCellEditor"){
                data.appendToBody = true
            }
            data["cellEditor.editable"] = true;
            data.columnName = props.field
            data.initialValue = props.rowData;
            return createEditor(data);

        } else {
            return undefined;
        }
    }

    async buildData(data){
        let tempArray = []
        data.records.forEach(set => {
            let tableData = {}
            for (let index = 0; index <= data.columnNames.length; index++){
                tableData[data.columnNames[index]] = set[index]
            }
            tempArray.push(tableData);
        });
        this.setState({Data: tempArray})
    }

    async onSelectChange(event){
        const value = event.data
        this.context.contentStore.emitChangeOfSelectedRow(value)
        this.context.serverComm.selectRow(this.props.name, this.props.dataProvider , value);
    }

    render(){
        return ( 
            <DataTable
                id={this.props.id}
                header="Table"
                value={this.state.Data ? this.state.Data : [] }

                onRowDoubleClick={this.onSelectChange.bind(this)}

                resizableColumns={true}
                columnResizeMode={"expand"}
                
                scrollable={true}
                style={{...this.props.layoutStyle}}
                >
                {this.dataColumns}
               
            </DataTable>);
    }
}
UITable.contextType = RefContext;
export default UITable;