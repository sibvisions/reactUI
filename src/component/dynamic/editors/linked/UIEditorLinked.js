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

    componentDidMount() {
        this.sub = this.context.contentSafe.selectedDataRowChange.subscribe(this.newSelection.bind(this))
    }

    componentWillUnmount() {
        this.sub.unsubscribe();
    }

    newSelection(newSelection){
        if(newSelection[this.data.columnName] !== null){
            this.setState({selectedObject: newSelection});
        } else {
            this.setState({selectedObject: undefined})
        }

        
    }

    async doesElementExist(toCheck){
        let foundObj = this.state.options.find(currentOpt => {
            return currentOpt[this.data.cellEditor.clearColumns[0]] === toCheck[this.data.cellEditor.clearColumns[0]]
        });
        return foundObj ? foundObj : toCheck
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

    fetchData(filter){
        let fetchPromise;
        if(filter){
            fetchPromise =  this.context.serverComm.fetchFilterdData(
                this.data.cellEditor.linkReference.dataProvider, 
                filter, this.data.name)
        } else {
            fetchPromise =  this.context.serverComm.fetchDataFromProvider(
                this.data.cellEditor.linkReference.dataProvider)
        }
        return fetchPromise
            .then(response => response.json())
            .then(this.formatFetchRequest.bind(this));
    }

    autoComplete(event){
        this.fetchData(event.query)
            .then(fetchedData => {
                this.setState({options: fetchedData, suggestions: fetchedData})
            });
            let elem = this.autoC.panel.element;
            this.autoC.panel.element.addEventListener("scroll", () => {

                if((elem.scrollHeight - elem.scrollTop - elem.clientHeight) <= 0){
                    console.log("end reached")
                } 
            })
    }

    render(){ 
        return (
            <AutoComplete
            ref= {r => this.autoC = r}
                dropdown={true}
                completeMethod={this.autoComplete.bind(this)}
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