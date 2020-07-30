import Base from "../../Base";
import React from 'react';

import { AutoComplete } from "primereact/autocomplete"
import { RefContext } from "../../../helper/Context";

class UIEditorLinked extends Base {

    state = {
        suggestions: [],
        options: [],
    }

    constructor(props){
        super(props)
        this.data = this.props.data
    }

    componentDidMount(){
        this.sub = this.context.contentSafe.selectedDataRowChange.subscribe(this.newSelection.bind(this))
        this.elem = this.autoC.panel.element;
        this.elem.addEventListener("scroll", this.handleScroll.bind(this));
    }

    componentWillUnmount(){
        this.elem.removeEventListener("scroll", this.handleScroll.bind(this));
        this.sub.unsubscribe();
    }

    handleScroll(){
        if((this.elem.scrollHeight - this.elem.scrollTop - this.elem.clientHeight) <= 0){
            console.log("end reached")
        } 
    }

    newSelection(newSelection){
        if(newSelection[this.data.columnName] !== null){
            this.setState({selectedObject: newSelection});
        } else {
            this.setState({selectedObject: undefined})
        }   
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
        this.context.serverComm.fetchFilterdData(
                this.data.cellEditor.linkReference.dataProvider, 
                filter, this.data.name)
        .then(response => response.json())
        .then(this.formatFetchRequest.bind(this))
        .then(fetchedData => {
            this.setState({options: fetchedData, suggestions: fetchedData})
        });
    }

    autoComplete(event){
        this.fetchData(event.query)
    }

    render(){ 
        return (
            <AutoComplete
                id={this.props.data.id}
                ref= {r => this.autoC = r}
                dropdown={true}
                completeMethod={this.autoComplete.bind(this)}
                field={this.data.columnName}    
                value={this.state.selectedObject}
                suggestions={this.state.suggestions}
                onChange={x => this.setState({selectedObject: x.target.value})}
            />
        )
    }
}
UIEditorLinked.contextType = RefContext
export default UIEditorLinked;