import Base from "../../Base";
import React from 'react';
import './UIEditorLinked.scss'

import { AutoComplete } from "primereact/autocomplete"
import { RefContext } from "../../../helper/Context";
import { checkCellEditorAlignments } from "../../../helper/CheckAlignments";
import withRowSelection from "../withRowSelection";

class UIEditorLinked extends Base {

    state = {
        suggestions: [],
        options: [],
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
        
        this.fetchSub = this.context.contentStore.fetchCompleted.subscribe(this.formatFetchResponse.bind(this));

        this.elem = this.autoC.panel.element;
        this.elem.addEventListener("scroll", this.handleScroll.bind(this));
    }

    componentWillUnmount(){
        this.elem.removeEventListener("scroll", this.handleScroll.bind(this));
        this.fetchSub.unsubscribe();
    }

    handleScroll(){
        if((this.elem.scrollHeight - this.elem.scrollTop - this.elem.clientHeight) <= 0){
            console.log("end reached")
        } 
    }

    formatFetchResponse(fetchedData){
        if(fetchedData.dataProvider === this.props.cellEditor.linkReference.dataProvider){
            let buildOptions = []
            fetchedData.records.forEach(record => {
                let element = {};
                record.forEach((data, index) => {
                    if(data !== null) element[this.props.cellEditor.clearColumns[index]] = data
                });
                buildOptions.push(element);
            });
            this.setState({suggestions: buildOptions})
        }
        
    }

    fetchFilterdData(filterString){
        this.context.serverComm.fetchFilterdData(
            this.props.cellEditor.linkReference.dataProvider,
            filterString,
            this.props.name);
    }

    autoComplete(event){
        this.fetchFilterdData(event.query)
    }

    render(){ 
        return (

            <AutoComplete
                id={this.props.id}
                ref= {r => this.autoC = r}
                style={this.props.layoutStyle}
                dropdown={true}
                completeMethod={this.autoComplete.bind(this)}
                field={this.props.columnName}
                value={this.state.selection ? this.state.selection : this.props.selection}
                suggestions={this.state.suggestions}
                onChange={x => this.setState({selectedObject: x.target.value})}
                disabled={!this.props["cellEditor.editable"]}
            />
        )
    }
}
UIEditorLinked.contextType = RefContext
export default withRowSelection(UIEditorLinked, RefContext);