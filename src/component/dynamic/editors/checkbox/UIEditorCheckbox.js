import React, { Component } from 'react';
import {Checkbox} from 'primereact/checkbox';


class UIEditorCheckbox extends Component {

    state = {}

    onChange

    render() { 
        return ( 
        <div>
            <label htmlFor={this.props.data.id} className="p-checkbox-label">{this.props.data.cellEditor.text} : </label>
            <Checkbox inputId={this.props.data.id} onChange={x => this.setState({checked: x.checked})} checked={this.state.checked}/>
        </div> );
    }
}
 
export default UIEditorCheckbox;