import React from 'react';
import BaseButton from '../BaseButton';
import { RefContext } from '../../../helper/Context';
import { getPreferredSize } from '../../../helper/GetPreferredSize';
import { RadioButton } from 'primereact/radiobutton';

class UIRadioButton extends BaseButton {

    state = {
        checked: false
    }

    componentDidMount() {
        this.context.contentStore.emitSizeCalculated({size: getPreferredSize(this), id: this.props.id, parent: this.props.parent, firstTime: true});
    }

    render() {
        return (
            <div ref={r => this.button = r} style={{
                ...this.props.layoutStyle,
                ...this.btnProps.style
            }}>
                <span id={this.btnProps.id}>
                    <RadioButton inputId={this.props.id} checked={this.state.checked} onChange={e => this.setState({ checked: e.value })} />
                    <label htmlFor={this.props.id}>{this.props.text}</label>
                </span>
            </div>
        )
    }
}
UIRadioButton.contextType = RefContext
export default UIRadioButton