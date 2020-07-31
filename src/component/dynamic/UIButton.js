import React from 'react';
import Base from './Base';
import { Button } from "primereact/button";

class UIButton extends Base {

    render() {
        return (
            <Button
                id={this.props.data.id}
                label={this.props.data.text}
                constraints={this.props.data.constraints}
                style={this.state.style}
            />
        )
    }
}
export default UIButton