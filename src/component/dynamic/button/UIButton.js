import React from 'react';
import Base from '../Base';
import './UIButton.scss'
import { Button } from "primereact/button";
import { RefContext } from '../../helper/Context';
import { checkAlignments, mapFlex } from '../../helper/CheckAlignments';
import { Size } from '../../helper/Size';

class UIButton extends Base {

    componentDidMount() {
        console.log(this.button)
        if(this.button.style !== undefined) {
            let alignments = mapFlex(checkAlignments(this.props))
            this.button.style.setProperty('display', 'flex');
            if (this.props.horizontalTextPosition === 1) {
                this.button.style.setProperty('flex-direction', 'column');
            }
            this.button.style.setProperty('justify-content', alignments.ha);
            this.button.style.setProperty('align-items', alignments.va);
            let size = new Size(parseInt(this.button.style.width), parseInt(this.button.style.height), undefined);
            this.button.children[0].style.setProperty('height', '100%');
            //this.button.children[0].style.setProperty('width', '100%');
            for (let child of this.button.children[0].children) {
                child.style.setProperty('background-color', this.props["cellEditor.background"])
                child.style.setProperty('padding', 0)
            }
        }
    }

    render() {
        let btnIcon;
        let btnIconPos;
        let btnStyle
        console.log(this.props.layoutStyle)
        if (this.props.layoutStyle !== undefined) {
            console.log(this.props.layoutStyle)
            btnStyle = this.props.layoutStyle
            btnStyle.width = btnStyle.width + 4 //+4 = 2 for border 2 for rounded down value
        }
        if (this.props.image !== undefined) {
            if (this.props.image.includes("FontAwesome")) {
                btnIcon = "fas fa-" + this.props.image.split('.')[1].split(',')[0]
            }
        }
        if (this.props.horizontalTextPosition === 0 || (this.props.horizontalTextPosition === 1 && this.props.verticalTextPosition === 0)) {
            btnIconPos = "right"
        }
        else {
            btnIconPos = "left"
        }
        console.log(btnStyle)
        return (
            <div ref={r => this.button = r} style={btnStyle}>
                <Button
                    id={this.props.id}
                    label={this.props.text}
                    constraints={this.props.constraints}
                    onClick={() => this.context.serverComm.pressButton(this.props.name)}
                    //style={{height: '100%', width: '100%'}}
                    icon={btnIcon}
                    iconPos={btnIconPos}
                />
            </div>
            
        )
    }
}
UIButton.contextType = RefContext
export default UIButton