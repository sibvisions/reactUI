import React from 'react';
import Base from '../Base';
import { Button } from "primereact/button";
import { RefContext } from '../../helper/Context';
import { checkAlignments, mapFlex } from '../../helper/CheckAlignments';
import { Size } from '../../helper/Size';
import { toPx } from '../../helper/ToPx';

class UIButton extends Base {

    componentDidMount() {
        if(this.button.props.style !== undefined) {
            let alignments = mapFlex(checkAlignments(this.props))
            this.button.element.style.setProperty('display', 'inline-flex');
            this.button.element.style.setProperty('justify-content', alignments.ha);
            this.button.element.style.setProperty('align-items', alignments.va);
            let size = new Size(parseInt(this.button.props.style.width), parseInt(this.button.props.style.height), undefined);
            for (let child of this.button.element.children) {
                    child.style.setProperty('background-color', this.props["cellEditor.background"])
                    child.style.setProperty('display', 'inline-flex');
                    child.style.setProperty('padding', 0)
            }
        }
    }

    render() {
        return (
            <Button
                id={this.props.id}
                ref={r => this.button = r}
                label={this.props.text}
                constraints={this.props.constraints}
                style={this.props.layoutStyle}
                onClick={() => this.context.serverComm.pressButton(this.props.name)}
            />
        )
    }
}
UIButton.contextType = RefContext
export default UIButton