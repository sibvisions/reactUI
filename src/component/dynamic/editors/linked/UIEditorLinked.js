import Base from "../../Base";
import React from 'react';

import { Dropdown } from "primereact/dropdown";
import { RefContext } from "../../../helper/Context";

class UIEditorLinked extends Base {

    componentDidMount() {
        this.sub = this.context.contentSafe.selectedDataRowChange.subscribe(this.setContent.bind(this))
        this.getData();
    }

    componentWillUnmount() {
        this.sub.unsubscribe();
    }

    setContent(content){
        if(content[this.props.data.columnName]){
            console.log(content)
            console.log(this.props.data)            //this.setState({text: content[this.props.data.columnName]});
        }
        //this.setState({selected: })
    }

    setDropDownOpt(options){
        let bOpt = []
        options[0].records.forEach(o => {
            bOpt.push({label: o[1], value: o[0]})
        });
        this.setState({options: bOpt});
    }

    getData(){
        this.context.serverComm.fetchDataFromProvider(this.props.data.cellEditor.linkReference.dataProvider)
            .then(x => x.json())
            .then(x => this.setDropDownOpt(x))
            .catch(er => console.log(er))
    }

    render() { 
        return ( <Dropdown 
            value= {this.state.selected ? this.state.selected : {}}
            options= {this.state.options ? this.state.options : [] }
            onChange= {x => this.setState({selected : x.value})}
            placeholder= "Select"
            />
            );
    }
}
UIEditorLinked.contextType = RefContext
export default UIEditorLinked;