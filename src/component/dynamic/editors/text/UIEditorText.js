import React from 'react';
import { InputText } from "primereact/inputtext";
import { RefContext } from '../../../helper/Context';
import Base from '../../Base';


class UIEditorText extends Base {



    componentDidMount() {
        this.startUp()
        this.sub = this.context.contentStore.selectedDataRowChange.subscribe(this.setContent.bind(this))
    }

    componentWillUnmount() {
        this.sub.unsubscribe();
    }

    setContent(content){
        if(content[this.props.columnName]){
            this.setState({selection: content[this.props.columnName]});
        }
    }

    render() {
        return ( 
            <InputText
                id={this.props.id}
                value={this.state.selection ? this.state.selection : ""}
                style={{...this.props.style, backgroundColor: this.props["cellEditor.background"]}}
                onChange={x => this.setState({selection: x.target.value})}
                disabled={!this.props["cellEditor.editable"]}
            /> 
        );
    }
}
UIEditorText.contextType = RefContext
export default UIEditorText;