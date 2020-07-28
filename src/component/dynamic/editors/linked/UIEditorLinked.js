import Base from "../../Base";
import React from 'react';

import { AutoComplete } from "primereact/autocomplete"
import { RefContext } from "../../../helper/Context";

class UIEditorLinked extends Base {

    state = {
        suggestions: [],
        options: []
    }

    constructor(props){
        super(props)
        this.data = this.props.data
    }

    formatFetchRequest(fetchResponse){
        let fetchedData = fetchResponse.find(x => x.name === "dal.fetch")
        let buildOptions = []
        fetchedData.records.forEach(record => {
            let element = {};
            record.forEach((data, index) => {
                if(data !== null) element[this.data.cellEditor.clearColumns[index]] = data
            });
            buildOptions.push(element);
        });
        return buildOptions
    }

    async fetchBaseData(){
        return this.context.serverComm.fetchDataFromProvider(this.data.cellEditor.linkReference.dataProvider)
        .then(response => response.json())
        .then(fetchResponse => {
            return this.formatFetchRequest(fetchResponse);
        })
    }

    async fetchFilterdData(filterString){
        this.context.serverComm.fetchFilterdData( this.data.cellEditor.linkReference.dataProvider, filterString, this.data.name)
        .then(response => response.json())
        .then(fetchResponse => {
            return this.formatFetchRequest(fetchResponse)
        });
    }

    setOptions(event){
        let filterdSuggestions = this.state.options.filter(opt => {
            if(event.query.length === 0) return true
            return opt[this.data.columnName].toLowerCase().includes(event.query.toLowerCase());
        })

        if(filterdSuggestions.length === 0){
            if(this.state.options.length === 0){
                this.fetchBaseData()
                    .then(baseOptions => {
                        this.setState({options: baseOptions,suggestions: baseOptions});
                    });
            } else {
                this.fetchFilterdData(event.query)
                    .then(filterdOptions => {
                        console.log(filterdOptions)
                    });
            }
        } else {
            this.setState({suggestions: filterdSuggestions})
        }
    }

    render(){ 
        return ( 
            <AutoComplete
                dropdown={true}
                completeMethod={this.setOptions.bind(this)}
                field={this.data.columnName}    
                value={this.state.selectedObject}
                suggestions={this.state.suggestions ? this.state.suggestions : []}
                onChange={x => this.setState({selectedObject: x.target.value})}
            />
        )
    }
}
UIEditorLinked.contextType = RefContext
export default UIEditorLinked;