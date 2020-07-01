import React from 'react';
import {Button} from 'primereact/button'

export class ButtonFactory {
    constructor(props) {
        var button = <Button 
        key={props.key} id={props.id}
        pid={props.pid} label={props.label}
        componentid={props.componentid}
        onClick={props.onClick} style={props.style}/>;
        return button;
    }
}