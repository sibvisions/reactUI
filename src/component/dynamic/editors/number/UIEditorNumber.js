import React from 'react';
import Base from '../../Base';
import { InputNumber } from 'primereact/inputnumber';
import { RefContext } from '../../../helper/Context';

class UIEditorNumber extends Base {


    componentDidMount() {
        let childList = document.getElementById(this.props.data.id).children
        for (let child of childList) {
            if (child.tagName === 'INPUT') {
                child.style.setProperty('background-color', this.props.data["cellEditor.background"])
            }
        }
        this.sub = this.context.contentStore.selectedDataRowChange.subscribe(this.setContent.bind(this))
    }

    componentWillUnmount() {
        this.sub.unsubscribe();
    }

    setContent(content){
        if(content[this.props.data.columnName]){
            this.setState({selection: content[this.props.data.columnName]});
        } else {
            this.setState({selection: undefined})
        }
    }


    render(){
        return(
            <InputNumber
                useGrouping={false}
                id={this.props.data.id}
                value={this.state.selection}
                style={this.props.style}
                onChange={x => this.setState({selection: x.target.value})}
                disabled={!this.props.data["cellEditor.editable"]}/>
        )
    }
}
UIEditorNumber.contextType = RefContext
export default UIEditorNumber