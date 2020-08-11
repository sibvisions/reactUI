import React from 'react';

import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import { Dropdown } from "primereact/dropdown";
import { Size } from '../../helper/Size';
import './UITable.scss'
import { RefContext } from '../../helper/Context';
import Base from '../Base';
import TextCellEditor from './cellEditors/TextCellEditor';
import UIEditorLinked from '../editors/linked/UIEditorLinked';


class UITable extends Base {
    content = [];
    dataColumns = [];
    metaData;
    state = {  }
    maximumSize = new Size(undefined, undefined, this.props.maximumSize)
    
    componentDidMount(){

        this.fetchSub = this.context.contentStore.fetchCompleted.subscribe(fetchData => {
            if(fetchData.dataProvider === this.props.data.dataProvider){
                this.buildData(fetchData);
            }
        })
        this.buildColumns(this.props.data.columnLabels, this.props.data.columnNames);

        let data = this.context.contentStore.storedData.get(this.props.data.dataProvider);
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
                "cellEditor.editable": false
            }
            const name = this.props.data.name;
            let metaData = this.context.contentStore.metaData.get(names[index])
            if(metaData){
                if(metaData.cellEditor.className === "TextCellEditor"){
                    props.editor = (props) => <TextCellEditor selection={props.rowData[names[index]]} />;
                } else if(metaData.cellEditor.className === "LinkedCellEditor"){
                    metaData.cellEditor.clearColumns = ["ID", names[index]];
                    const data= {
                        "cellEditor.editable": true,
                        columnName: names[index],
                        ...metaData,
                        name: name,
                    }
                    props.editor = (props) => <Dropdown options={[1,2,3,4,5,6,7,8,9,10]}/>
                }



                let column = <Column {...props}/>
                this.dataColumns.push(column);
            }
        }
    }

    buildCellEditorColumn(field, header, key, cellEditor){
        let column = <Column 
        field={field} 
        header={header}
        key={key}
        editor={() => cellEditor}/>;

        return column
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
        let value = event.value
        this.context.contentStore.emitChangeOfSelectedRow(value)
        this.context.serverComm.selectRow(this.props.data.name, this.props.data.dataProvider , event.value);

    }

    render(){
        return ( 
            <DataTable
                resizableColumns={true}
                columnResizeMode={"expand"}
                id={this.props.data.id}
                value={this.state.Data ? this.state.Data : [] } 
                scrollable={true} 
                valueable={true}    
                scrollHeight="100%" 
                style={this.props.style}
                header="Table"
                selectionMode="single"
                onSelectionChange={this.onSelectChange.bind(this)}>
                {this.dataColumns}
            </DataTable>);
    }
}
UITable.contextType = RefContext;
export default UITable;