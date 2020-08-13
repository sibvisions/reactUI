import Base from "../../Base";
import React from 'react';
import './UIEditorLinked.scss'

import { AutoComplete } from "primereact/autocomplete"
import { RefContext } from "../../../helper/Context";
import { checkCellEditorAlignments } from "../../../helper/CheckAlignments";

class UIEditorLinked extends Base {

    state = {
        suggestions: [],
        options: [],
    }

    constructor(props){
        super(props)
        this.data = this.props
    }

    componentDidMount(){
        if (this.autoC.container !== null) {
            let alignments = checkCellEditorAlignments(this.props);
            for (let child of this.autoC.container.children) {
                if (child.tagName === 'INPUT') {
                    child.style.setProperty('background-color', this.props["cellEditor.background"])
                    child.style.setProperty('text-align', alignments.ha)
                }
            }
        }
        
        this.selectionSub = this.context.contentStore.selectedDataRowChange.subscribe(this.newSelection.bind(this));
        this.fetchSub = this.context.contentStore.fetchCompleted.subscribe(this.formatFetchResponse.bind(this));

        this.elem = this.autoC.panel.element;
        this.elem.addEventListener("scroll", this.handleScroll.bind(this));
    }

    componentWillUnmount(){
        this.elem.removeEventListener("scroll", this.handleScroll.bind(this));
        this.selectionSub.unsubscribe();
        this.fetchSub.unsubscribe();
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

    formatFetchResponse(fetchedData){
        if(fetchedData.dataProvider === this.data.cellEditor.linkReference.dataProvider){
            let buildOptions = []
            fetchedData.records.forEach(record => {
                let element = {};
                record.forEach((data, index) => {
                    if(data !== null) element[this.data.cellEditor.clearColumns[index]] = data
                });
                buildOptions.push(element);
            });
            this.setState({suggestions: buildOptions})
        }
        
    }

    fetchFilterdData(filterString){
        this.context.serverComm.fetchFilterdData(
            this.data.cellEditor.linkReference.dataProvider,
            filterString,
            this.data.name);
    }

    autoComplete(event){
        this.fetchFilterdData(event.query)
    }

    render(){ 
        return (
            <AutoComplete
                id={this.data.id}
                ref= {r => this.autoC = r}
                style={this.props.layoutStyle}
                dropdown={true}
                completeMethod={this.autoComplete.bind(this)}
                field={this.data.columnName}
                value={this.state.selectedObject}
                suggestions={this.state.suggestions}
                onChange={x => this.setState({selectedObject: x.target.value})}
                disabled={!this.data["cellEditor.editable"]}
            />
        )
    }
}
UIEditorLinked.contextType = RefContext
export default UIEditorLinked;