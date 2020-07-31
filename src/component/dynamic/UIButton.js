import React from 'react';
import Base from './Base';
import { Button } from "primereact/button";
import { RefContext } from '../helper/Context';

class UIButton extends Base {

    render() {
        return (
            <Button
                id={this.props.data.id}
                label={this.props.data.text}
                constraints={this.props.data.constraints}
                style={this.state.style}
                onClick={() => this.context.serverComm.pressButton(this.props.data.name)}
            />
        )
    }
}
UIButton.contextType = RefContext
export default UIButton