import React from 'react';
import Base from '../Base';
import './UITable.scss'

import { Size } from '../../helper/Size';
import { RefContext } from '../../helper/Context';
import { createEditor } from "../../factories/ComponentFactory";

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getPreferredSize } from '../../helper/GetPreferredSize';

class UITable extends Base {
    content = [];
    dataColumns = [];
    data;
    state = { }
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
        this.context.contentStore.emitSizeCalculated({size: getPreferredSize(this), id: this.props.id, parent: this.props.parent, firstTime: true});
    }

    componentWillUnmount(){
        this.fetchSub.unsubscribe();
    }

    buildColumns(labels, names){
        for (let index = 0; index < labels.length; index++){
            let columnProps= {
                field: names[index],
                header: labels[index],
                key: names[index],
            }
            let metaData = this.context.contentStore.metaData.get(names[index]);
            if(metaData){
                metaData.name = this.props.name;
                metaData.cellEditor.clearColumns = ["ID", names[index]]
                columnProps.editor = (props) => this.buildEditor(props, metaData)
            }
            this.dataColumns.push(<Column on {...columnProps}/>);
        }
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
            data.initialValue = props.rowData[props.field];
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
                on
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