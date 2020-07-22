import React, { Component } from 'react';

import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import { Size } from '../helper/Size';
import './UITable.scss'
import Base from './Base';


class UITable extends Base {
    content = [];
    dataColumns = [];
    state = {
        testData: []
    }
    maximumSize = new Size(undefined, undefined, this.props.maximumSize)
    
    constructor(props){
        super(props);
        this.buildColumns(this.props.columnLabels, this.props.columnNames);
        let reqOpt = {
            method: 'POST',
            body: JSON.stringify({clientId: localStorage.getItem("clientId"), dataProvider: this.props.dataProvider}),
            credentials:"include"
        };
        fetch("http://localhost:8080/JVx.mobile/services/mobile/api/dal/fetch", reqOpt)
            .then(res => res.json())
            .then(jres => {console.log(jres); this.buildData(jres)})
    }

    buildColumns(labels, names){
        for (let index = 0; index < labels.length; index++){
            const column = <Column 
            field={names[index]} 
            header={labels[index]}
            key={names[index]}
            ref={ref => column.columnRef = ref}/>;
            this.dataColumns.push(column);
        }
    }

    buildData(data){
        let tempArray = []
        data[0].records.forEach(set => {
            let tableData = {}
            for (let index = 0; index <= data[0].columnNames.length; index++){
                tableData[data[0].columnNames[index]] = set[index]
            }
            tempArray.push(tableData);
        });
        this.setState({testData: tempArray})
    }

    getPrefferedSize() {
        console.log(this.maximumSize)
    }

    render() {
        return ( 
            <DataTable 
                value={this.state.testData} 
                scrollable={true} 
                valueable={true} 
                scrollHeight="100%" 
                style={{maxWidth: this.maximumSize.getWidth(), maxHeight: this.maximumSize.getHeight(), width: '100%', height: '100%'}}
                ref={ref => this.compRef = ref} 
                header="Table">
                {this.dataColumns}
            </DataTable>);
    }
}
 
export default UITable;