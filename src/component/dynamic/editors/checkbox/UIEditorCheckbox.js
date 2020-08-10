import React, { Component } from 'react';
import {Checkbox} from 'primereact/checkbox';


class UIEditorCheckbox extends Component {

    state = {}

    render() {
        console.log(this.props)
        return ( 
        <span id={this.props.data.id} style={{...this.props.style, backgroundColor: this.props.data["cellEditor.background"]}}>
            <label htmlFor={this.props.data.id} className="p-checkbox-label">{this.props.data.cellEditor.text} : </label>
            <Checkbox inputId={this.props.data.id} onChange={x => this.setState({checked: x.checked})} checked={this.state.checked} disabled={!this.props.data["cellEditor.editable"]}/>
        </span> );
    }
}
 
export default UIEditorCheckbox;