import React from 'react';
import { InputText } from "primereact/inputtext";
import Base from '../../Base';

class UIEditorDisabled extends Base {
    render() {
        return ( 
            <InputText
                disabled={true}
                id={this.props.data.id}
                contentEditable="false"
                style={{...this.props.style, backgroundColor:this.props.data.background}}
            />
        );
    }
}
export default UIEditorDisabled;