import React from 'react';
import Base from '../Base';
import { Button } from "primereact/button";
import { RefContext } from '../../helper/Context';

class UIButton extends Base {

    render() {
        return (
            <Button
                id={this.props.id}
                label={this.props.text}
                constraints={this.props.constraints}
                style={this.props.style}
                onClick={() => this.context.serverComm.pressButton(this.props.name)}
            />
        )
    }
}
UIButton.contextType = RefContext
export default UIButton