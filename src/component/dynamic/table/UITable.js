import React from 'react';
import Base from '../Base';
import './UITable.scss'

import { Size } from '../../helper/Size';
import { RefContext } from '../../helper/Context';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from "primereact/dropdown";

class UITable extends Base {
    content = [];
    dataColumns = [];
    metaData;
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
        for (let index = 0; index < labels.length; index++){
            let props= {
                field: names[index],
                header: labels[index],
                key: names[index],
            }
            let metaData = this.context.contentStore.metaData.get(names[index])
            if(metaData){
                if(metaData.cellEditor.className === "TextCellEditor"){
                    
                } else if(metaData.cellEditor.className === "LinkedCellEditor"){
                    props.body = () => <Dropdown appendTo={document.body} options={[1,2,3,4,5,6,7,8,9,10]}/>
                }
                let column = <Column {...props}/>   
                this.dataColumns.push(column);
            }
        }

         labels.map(async (label, index) => {

        })
    }

    buildData(data){
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

    onSelectChange(event){
        const value = event.value
        this.context.contentStore.emitChangeOfSelectedRow(value)
        this.context.serverComm.selectRow(this.props.name, this.props.dataProvider , value);
    }

    render(){
        return ( 
            <DataTable
                resizableColumns={true}
                columnResizeMode={"expand"}
                id={this.props.id}
                value={this.state.Data ? this.state.Data : [] } 
                scrollable={true} 
                header="Table"
                style={{...this.props.layoutStyle}}
                selectionMode={"single"}
                onSelectionChange={this.onSelectChange.bind(this)}
                >
                {this.dataColumns}
            </DataTable>);
    }
}
UITable.contextType = RefContext;
export default UITable;