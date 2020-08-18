import React from 'react';
import Base from '../Base';
import './UIButton.scss'
import { Button } from "primereact/button";
import { RefContext } from '../../helper/Context';
import { checkAlignments, mapFlex } from '../../helper/CheckAlignments';
import { Size } from '../../helper/Size';
import { toPx } from '../../helper/ToPx';
import { Margins } from '../../layouts/layoutObj/Margins';

class UIButton extends Base {

    splittedImageName;
    index;
    btnIcon;
    btnIconPos;

    componentDidMount() {
        this.styleButton(this.button.children[0]);
        this.styleChildren(this.button.children[0].children)
    }

    styleButton(btn) {
        let alignments = mapFlex(checkAlignments(this.props))
        btn.style.setProperty('display', 'flex');
        if (this.props.horizontalTextPosition === 1) {
            btn.style.setProperty('flex-direction', 'column');
        }
        btn.style.setProperty('justify-content', alignments.ha);
        btn.style.setProperty('align-items', alignments.va);
        let size = new Size(parseInt(this.button.style.width), parseInt(this.button.style.height), undefined);
        btn.style.setProperty('height', toPx(size.height));
        btn.style.setProperty('width', toPx(size.width));
    }

    styleChildren(btnChildren) {
        console.log(this.splittedImageName)
        for (let child of btnChildren) {
            if (child.classList.contains('fas') || child.classList.contains("p-button-icon-left")) {
                if (this.index < 0) {
                    child.style.setProperty('width', toPx(this.splittedImageName[1]));
                    child.style.setProperty('height', toPx(this.splittedImageName[2]));
                }
                else {
                    this.splittedImageName.forEach(prop => {
                        if (prop.indexOf("size") >= 0) {
                            let size = prop.substring(prop.indexOf('=')+1);
                            child.style.setProperty('height', toPx(size))
                            child.style.setProperty('width', toPx(size))
                        }
                        else if (prop.indexOf("color") >= 0) {
                            let iconColor = prop.substring(prop.indexOf('=')+1);
                            child.style.setProperty('color', iconColor)
                        }  
                    });
                }
            }
            console.log(child, child.classList.contains('icon'))
            child.style.setProperty('background-color', this.props["cellEditor.background"])
            child.style.setProperty('padding', 0)
        }
    }

    setIcon(imageString) {
        console.log(imageString)
        if (imageString !== undefined) {
            if (imageString.includes("FontAwesome")) {
                this.index = imageString.indexOf(";")
                if (this.index < 0) {
                    let iconString = imageString.slice(imageString.indexOf('.')+1)
                    this.splittedImageName = iconString.split(',');
                    this.btnIcon = "fas fa-" + this.splittedImageName[0];
                }
                else {
                    let iconString = imageString.slice(imageString.indexOf('.')+1).split(',');
                    this.splittedImageName = iconString[0].split(';');
                    this.btnIcon = "fas fa-" + this.splittedImageName[0];
                }
            }
            else {
                this.index = -1;
                this.splittedImageName = imageString.split(',')
                this.btnIcon = this.splittedImageName[0]
            }
        }
    }

    setIconPos(hTextPos, vTextPos) {
        if (hTextPos === 0 || (hTextPos === 1 && vTextPos === 0)) {
            this.btnIconPos = "right"
        }
        else {
            this.btnIconPos = "left"
        }
    }

    render() {
        let margins = new Margins([5, 5, 5, 5])
        if (this.props.margins !== undefined) {
            margins = new Margins(this.props.margins.split(','))
        }
        this.setIcon(this.props.image);
        //this.setIcon(process.env.PUBLIC_URL + '/assets/sibvisionslogo.png,16,16');
        this.setIconPos(this.props.horizontalTextPosition, this.props.verticalTextPosition);
        return (
            <div ref={r => this.button = r} style={this.props.layoutStyle}>
                <Button
                    id={this.props.id}
                    label={this.props.text}
                    constraints={this.props.constraints}
                    onClick={() => this.context.serverComm.pressButton(this.props.name)}
                    style={{paddingTop: margins.marginTop, paddingLeft: margins.marginLeft, paddingBottom: margins.marginBottom, paddingRight: margins.marginRight}}
                    icon={this.btnIcon}
                    iconPos={this.btnIconPos}
                />
            </div>
            
        )
    }
}
UIButton.contextType = RefContext
export default UIButton