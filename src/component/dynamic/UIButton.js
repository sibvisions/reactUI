import React from 'react';
import Base from './Base';
import { Button } from "primereact/button";

class UIButton extends Base {

    render() {
        return (
            <Button
            key={this.props.key}
            id={this.props.id}
            label={this.props.label}
            constraints={this.props.constraints}
            onClick={this.props.onClick}
            style={this.state.style}
            ref={ref => this.compRef = ref}/>
        )
    }
}
export default UIButton