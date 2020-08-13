import React from 'react';
import { InputText } from "primereact/inputtext";
import { RefContext } from '../../../helper/Context';
import Base from '../../Base';
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';


class UIEditorText extends Base {

    componentDidMount() {
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
        let alignment = checkCellEditorAlignments(this.props)
        return ( 
            <InputText
                id={this.props.id}
                value={this.state.selection ? this.state.selection : ""}
                style={{...this.props.layoutStyle, backgroundColor: this.props["cellEditor.background"], textAlign: alignment.ha}}
                onChange={x => this.setState({selection: x.target.value})}
                disabled={!this.props["cellEditor.editable"]}
            /> 
        );
    }
}
UIEditorText.contextType = RefContext
export default UIEditorText;