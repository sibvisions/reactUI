import React from 'react';
import { InputText } from "primereact/inputtext";
import Base from '../../Base';
import { getPreferredSize } from '../../../helper/GetSizes';
import { RefContext } from '../../../helper/Context';

class UIEditorDisabled extends Base {

    componentDidMount() {
        this.context.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(this.props), 
                id: this.props.id, 
                parent: this.props.parent
            }
        );
    }

    render() {
        return ( 
            <InputText
                disabled={true}
                id={this.props.id}
                contentEditable="false"
                style={{...this.props.layoutStyle, backgroundColor:this.props.background}}
            />
        );
    }
}
UIEditorDisabled.contextType = RefContext;
export default UIEditorDisabled;