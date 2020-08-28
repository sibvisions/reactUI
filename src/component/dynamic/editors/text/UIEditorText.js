import React from 'react';
import { InputText } from "primereact/inputtext";
import { RefContext } from '../../../helper/Context';
import Base from '../../Base';
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';
import withRowSelection from '../withRowSelection';
import { getPreferredSize } from '../../../helper/GetPreferredSize';


class UIEditorText extends Base {

    componentDidMount() {
        this.context.contentStore.emitSizeCalculated({size: getPreferredSize(this), id: this.props.id, parent: this.props.parent, firstTime: true});
    }


    render() {
        let alignment = checkCellEditorAlignments(this.props)
        let newSelection = ""
        if(this.props.selection){
            newSelection = this.props.selection[this.props.columnName];
        }
        return ( 
            <InputText
                id={this.props.id}
                value={this.state.selection ? this.state.selection : newSelection}
                style={{...this.props.layoutStyle, backgroundColor: this.props["cellEditor.background"], textAlign: alignment.ha}}
                onChange={x => this.setState({selection: x.value})}
                disabled={!this.props["cellEditor.editable"]}
            /> 
        );
    }
}
export default withRowSelection(UIEditorText, RefContext);
//export default UIEditorText