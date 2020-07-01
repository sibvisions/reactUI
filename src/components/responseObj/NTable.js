import React from 'react';
import BaseV2 from './BaseV2';

import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';


class NTable extends BaseV2 {
    content = [];
    dataColumns = [];

    testData= [{
        SALU_SALUTATION: "Herr",
        LASTNAME: "Nachname"
    }]

    
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
            header={names[index]}
            style={{width: "200px"}}
            key={labels[index]}/>;
            this.dataColumns.push(column);
        }
    }

    buildData(data){
        data[0].records.forEach(set => {
            console.log(set)
        });
    }

    render() { 
        return ( 
        <div style={{marginLeft: "10px"}}>
            <h1>Table</h1>
            <DataTable 
                value={this.testData} 
                scrollable={true} 
                valueable={true} 
                scrollHeight="100px" 
                style={{width:"100%"}} 
                header="Table">

                {this.dataColumns}
            </DataTable>
        </div> );
    }
}
 
export default NTable;