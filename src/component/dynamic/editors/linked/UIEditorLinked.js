import Base from "../../Base";
import React from 'react';

import { AutoComplete } from "primereact/autocomplete"
import { RefContext } from "../../../helper/Context";

class UIEditorLinked extends Base {

    constructor(props){
        super(props)

        this.data = this.props.data
        console.log(this.data)
    }

    componentDidMount(){
        this.sub = this.context.contentSafe.selectedDataRowChange.subscribe(this.setContent.bind(this))
    }

    componentWillUnmount(){
        this.sub.unsubscribe();
    }

    setContent(content){
        let newSelection = {}
        
        this.data.cellEditor.clearColumns.forEach(columName => {
            if(content[columName]){
                newSelection[columName] = content[columName];
            }
        });
        console.log(newSelection);
        this.setState({
            options: [newSelection],
        })
    }

    getOptions(){
        
            this.context.serverComm.fetchDataFromProvider(this.props.data.cellEditor.linkReference.dataProvider)
                .then(x => x.json())
                .then(this.setOptions.bind(this))       
        
    }

    setOptions(response){
        let fetchedData = response[0];
        let buildOptions = []
        fetchedData.records.forEach(record => {
            let element = {};
            record.forEach((data, index) => {
                if(data !== null) element[this.data.cellEditor.clearColumns[index]] = data
            });
            buildOptions.push(element);
        });
        this.setState({
            suggestions: buildOptions
        })
        console.log(this.data)
        console.log(buildOptions)
    }

    render(){ 
        return ( 
            <AutoComplete 
                dropdown={true}
                completeMethod={this.getOptions.bind(this)}
                field={this.data.columnName}
                value={this.state.selected}
                suggestions={this.state.suggestions}
                onChange={x => this.setState({selected: x.value})}
                readonly={true}

            />
        )
    }
}
UIEditorLinked.contextType = RefContext
export default UIEditorLinked;