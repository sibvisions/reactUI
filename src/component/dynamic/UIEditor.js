import React from 'react';
import { InputText } from "primereact/inputtext";
import Base from './Base';

class UIEditor extends Base {

    render() {
        return ( 
            <InputText id={this.props.id} ref={ref => this.compRef = ref} style={this.state.style} /> 
         );
    }
}
 
export default UIEditor;