import React from 'react';
import {Checkbox} from 'primereact/checkbox';
import Base from '../../Base';
import { checkCellEditorAlignments, mapFlex } from '../../../helper/CheckAlignments';
import { getPreferredSize } from '../../../helper/GetPreferredSize';
import { RefContext } from '../../../helper/Context';


class UIEditorCheckbox extends Base {

    state = {}

    componentDidMount() {
        this.context.contentStore.emitSizeCalculated({size: getPreferredSize(this), id: this.props.id, parent: this.props.parent, firstTime: true})
    }

    render() {
        let alignments = mapFlex(checkCellEditorAlignments(this.props))
        return ( 
        <span id={this.props.id} style={{...this.props.layoutStyle, backgroundColor: this.props["cellEditor.background"], display: 'inline-flex', justifyContent: alignments.ha}}>
            <Checkbox inputId={this.props.id} style={{alignSelf: alignments.va}} onChange={x => this.setState({checked: x.checked})} checked={this.state.checked} disabled={!this.props["cellEditor.editable"]}/>
            <label htmlFor={this.props.id} style={{alignSelf: alignments.va}} className="p-checkbox-label">{this.props.cellEditor.text}</label>
        </span> );
    }
}
UIEditorCheckbox.contextType = RefContext;
export default UIEditorCheckbox;