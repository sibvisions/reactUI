import React from 'react';
import Base from './Base';

import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import { Size } from '../frontend/helper/Size';


class NTable extends Base {
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
            style={{width: "200px"}}
            key={names[index]}/>;
            this.dataColumns.push(column);
        }
    }

    buildData(data){
        let tempArray = []
        data[0].records.forEach(set => {
            let personData = {}
            for (let index = 0; index <= data[0].columnNames.length; index++){
                personData[data[0].columnNames[index]] = set[index]
            }
            tempArray.push(personData);
        });
        this.setState({testData: tempArray})
    }

    render() {
        return ( 
            <DataTable 
                value={this.state.testData} 
                scrollable={true} 
                valueable={true} 
                scrollHeight="100px" 
                style={{maxWidth: this.maximumSize.getWidth(), maxHeight: this.maximumSize.getHeight()}} 
                header="Table">
                {this.dataColumns}
            </DataTable>);
    }
}
 
export default NTable;