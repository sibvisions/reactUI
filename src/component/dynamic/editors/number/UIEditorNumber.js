import React from 'react';
import Base from '../../Base';
import { InputNumber } from 'primereact/inputnumber';
import { RefContext } from '../../../helper/Context';

class UIEditorNumber extends Base {


    componentDidMount() {
        let childList = document.getElementById(this.props.id).children
        for (let child of childList) {
            if (child.tagName === 'INPUT') {
                child.style.setProperty('background-color', this.props["cellEditor.background"])
            }
        }
        this.sub = this.context.contentStore.selectedDataRowChange.subscribe(this.setContent.bind(this))
    }

    componentWillUnmount() {
        this.sub.unsubscribe();
    }

    setContent(content){
        if(content[this.props.columnName]){
            this.setState({selection: content[this.props.columnName]});
        } else {
            this.setState({selection: undefined})
        }
    }


    render(){
        return(
            <InputNumber
                useGrouping={false}
                id={this.props.id}
                value={this.state.selection}
                style={this.props.style}
                onChange={x => this.setState({selection: x.target.value})}
                disabled={!this.props["cellEditor.editable"]}/>
        )
    }
}
UIEditorNumber.contextType = RefContext
export default UIEditorNumber