import React from 'react';
import BaseButton from '../BaseButton';
import { RefContext } from '../../../helper/Context';
import { getPreferredSize } from '../../../helper/GetSizes';
import { RadioButton } from 'primereact/radiobutton';

class UIRadioButton extends BaseButton {

    state = {
        checked: this.props.selected ? true : false
    }

    componentDidMount() {
        this.styleButton(this.button.children[0]);
        this.styleChildren(this.button.children[0].children)
        this.context.contentStore.emitSizeCalculated({size: getPreferredSize(this), id: this.props.id, parent: this.props.parent, firstTime: true});
    }

    render() {
        return (
            <div ref={r => this.button = r} style={this.props.layoutStyle}>
                <span id={this.btnProps.id} style={this.btnProps.style} tabIndex={this.btnProps.tabIndex}>
                    <RadioButton
                        value={this.props.id}
                        inputId={this.btnProps.id}
                        style={{ order: this.btnProps.iconPos === 'left' ? '1' : '2' }}
                        checked={this.state.checked}
                        onChange={() => {
                            this.setState({checked: !this.state.checked})
                            this.context.serverComm.pressButton(this.props.name)
                        }}
                    />
                    <label
                        className="p-radiobutton-label"
                        htmlFor={this.btnProps.id}
                        style={{ order: this.btnProps.iconPos === 'left' ? '2' : '1' }}>
                        {this.props.text}
                    </label>
                </span>
            </div>
        )
    }
}
UIRadioButton.contextType = RefContext
export default UIRadioButton