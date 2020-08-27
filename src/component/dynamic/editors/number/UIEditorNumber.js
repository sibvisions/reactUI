import React from 'react';
import Base from '../../Base';
import { InputNumber } from 'primereact/inputnumber';
import { RefContext } from '../../../helper/Context';
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';
import withRowSelection from '../withRowSelection';
import { getPreferredSize } from '../../../helper/GetPreferredSize';

class UIEditorNumber extends Base {


    componentDidMount() {
        if (this.number.element !== null) {
            let alignments = checkCellEditorAlignments(this.props)
            for (let child of this.number.element.children) {
                if (child.tagName === 'INPUT') {
                    child.style.setProperty('background-color', this.props["cellEditor.background"])
                    child.style.setProperty('text-align', alignments.ha)
                }
            }
        }
        this.context.contentStore.emitSizeCalculated({size: getPreferredSize(this), id: this.props.id, parent: this.props.parent, firstTime: true});
    }

    render(){
        let newSelection = ""
        if(this.props.selection){
            newSelection = this.props.selection[this.props.columnName];
        }
        return( 
            <InputNumber
                useGrouping={false}
                id={this.props.id}
                ref={r => this.number = r}
                value={this.state.selection ? this.state.selection : newSelection}
                style={this.props.layoutStyle}
                onChange={x => this.setState({selection: x.target.value})}
                disabled={!this.props["cellEditor.editable"]}/>
        )
    }
}
export default withRowSelection(UIEditorNumber, RefContext);