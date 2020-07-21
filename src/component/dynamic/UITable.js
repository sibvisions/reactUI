import React, { Component } from 'react';

import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import { Size } from '../helper/Size';
import './UITable.scss'
import { RefContext } from '../helper/Context';


class UITable extends Component {
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
    }

    componentDidMount() {
        this.context.serverComm.fetchDataFromProvider(this.props.dataProvider)
            .then(res => res.json())
            .then(jres => this.buildData(jres))
    }

    RecievedMetaData(metaData){
        
    }

    buildColumns(labels, names){
        for (let index = 0; index < labels.length; index++){
            const column = <Column 
            field={names[index]} 
            header={labels[index]}
            style={{width: "100%"}}
            key={names[index]}/>;
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

    render() {
        return ( 
            <DataTable 
                value={this.state.testData} 
                scrollable={true} 
                valueable={true}
                scrollHeight="100%" 
                style={{
                    overflow:"hidden",
                    height: '100%'}} 
                header="Table">
                {this.dataColumns}
            </DataTable>);
    }
}
UITable.contextType = RefContext;
export default UITable;