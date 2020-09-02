import React from 'react';
import { InputText } from "primereact/inputtext";
import { RefContext } from '../../../helper/Context';
import Base from '../../Base';
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';
import withRowSelection from '../withRowSelection';
import { getPreferredSize } from '../../../helper/GetSizes';


class UIEditorText extends Base {

    componentDidMount() {
        this.context.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize({
                    id: this.props.id, 
                    preferredSize: this.props.preferredSize,
                    horizontalTextPosition: this.props.horizontalTextPosition,
                    minimumSize: this.props.minimumSize,
                    maximumSize: this.props.maximumSize
                }), 
                id: this.props.id, 
                parent: this.props.parent
            }
        );
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