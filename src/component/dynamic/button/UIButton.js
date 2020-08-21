import React from 'react';
import Base from '../Base';
import './UIButton.scss'
import { Button } from "primereact/button";
import { RefContext } from '../../helper/Context';
import { checkAlignments, mapFlex } from '../../helper/CheckAlignments';
import { Size } from '../../helper/Size';
import { toPx } from '../../helper/ToPx';
import { Margins } from '../../layouts/layoutObj/Margins';
import { UIFont } from '../../helper/UIFont';
import tinycolor from 'tinycolor2';

class UIButton extends Base {

    btnMargins;
    btnAlignments;
    btnDirection;
    btnFont;
    btnIcon;
    btnIconPos;
    iconSize;
    customIcon = false;
    btnBgd;
    borderPainted = false;
    focusable = false;

    constructor(props) {
        super(props);
        this.btnMargins = this.getMargins();
        this.btnAlignments = this.getAlignments();
        this.setBtnDirection(props.horizontalTextPosition)
        this.btnFont = this.getFont();
        this.parseIconData(props.image);
        this.setIconPos(props.horizontalTextPosition, this.props.verticalTextPosition);
        this.btnBgd = this.getBtnBgdColor();
        this.setBorderPainted(props.borderPainted);
        this.setBtnFocusable(props.focusable);
    }

    componentDidMount() {
        this.styleButton(this.button.children[0]);
        this.styleChildren(this.button.children[0].children)
        let color;
        if (this.props.background) color = this.props.background;
        else color = "#007ad9";
        this.addHoverEffect(this.button.children[0], color, 5)
    }

    styleButton(btn) {
        if (btn.classList.contains("p-button-icon-only")) {
            for (let child of btn.children) {
                if (child.classList.contains("p-button-text")) {
                    child.remove()
                }
            }
        }
        let size = new Size(parseInt(this.button.style.width), parseInt(this.button.style.height), undefined);
        btn.style.setProperty('height', toPx(size.height));
        btn.style.setProperty('width', toPx(size.width));
    }

    styleChildren(btnChildren) {
        for (let child of btnChildren) {
            if (child.classList.contains('fas') || child.classList.contains(this.btnIcon)) {
                    child.style.setProperty('width', toPx(this.iconSize.width));
                    child.style.setProperty('height', toPx(this.iconSize.height));
                    if (this.iconColor !== null) {
                        child.style.setProperty('color', this.iconColor);
                    }
                    if (child.classList.contains(this.btnIcon)) {
                        child.classList.add("custom-icon");
                        child.style.setProperty('--icon', 'url(' + this.btnIcon + ')');
                    }
                    if (this.props.imageTextGap !== undefined) {
                        let gapPos = this.getGapPos(this.props.horizontalTextPosition, this.props.verticalTextPosition);
                        child.style.setProperty('margin-' + gapPos, toPx(this.props.imageTextGap));
                    }
            }
            child.style.setProperty('padding', 0)
        }
    }

    addHoverEffect(obj, color, dark) {
        if ((this.props.borderOnMouseEntered && this.borderPainted) || (!this.props.borderOnMouseEntered && this.borderPainted)) {
            obj.onmouseover = () => {
                obj.style.setProperty('background', tinycolor(color).darken(dark))
                obj.style.setProperty('border-color', tinycolor(color).darken(dark))
            }
            obj.onmouseout = () => {
                obj.style.setProperty('background', color)
                obj.style.setProperty('border-color', color)
            }
        }
        else if (this.props.borderOnMouseEntered && !this.borderPainted) {
            obj.onmouseover = () => {
                obj.style.setProperty('background', color)
                obj.style.setProperty('border-color', color)
            }
            obj.onmouseout = () => {
                obj.style.setProperty('background', this.btnBgd)
                obj.style.setProperty('border-color', this.btnBgd)
            }
        }
    }

    getGapPos(hTextPos, vTextPos) {
        if (hTextPos === 0) {
            return 'left'
        }
        else if (hTextPos === undefined) {
            return 'right'
        }
        else if (hTextPos === 1 && vTextPos === 2) {
            return 'bottom'
        }
        else if (hTextPos === 1 && vTextPos === 0) {
            return 'top'
        }
    }

    setBtnDirection(hTextPos) {
        if (hTextPos === 1) {
            this.btnDirection = 'column'
        }
        else {
            this.btnDirection = 'row'
        }
    }

    parseIconData(iconData) {
        if (iconData !== undefined) {
            let splittedIconData;
            if (iconData.includes("FontAwesome")) {
                let index = iconData.indexOf(";")
                if (index < 0) {
                    let iconString = iconData.slice(iconData.indexOf('.')+1)
                    splittedIconData = iconString.split(',');
                    this.btnIcon = "fas fa-" + splittedIconData[0];
                    this.iconSize = new Size(splittedIconData[1], splittedIconData[2]);
                }
                else {
                    let iconString = iconData.slice(iconData.indexOf('.')+1).split(',');
                    splittedIconData = iconString[0].split(';');
                    this.btnIcon = "fas fa-" + splittedIconData[0];
                    splittedIconData.splice(splittedIconData, 1)
                    let sizeFound = false;
                    let colorFound = false;
                    splittedIconData.forEach(prop => {
                        if (prop.indexOf("size") >= 0) {
                            this.iconSize = new Size(prop.substring(prop.indexOf('=')+1), prop.substring(prop.indexOf('=')+1));
                            sizeFound = true;
                        }
                        else if (prop.indexOf("color") >= 0) {
                            this.iconColor = prop.substring(prop.indexOf('=')+1);
                            colorFound = true;
                        }
                    });
                    if (!sizeFound) {
                        this.iconSize = new Size(iconString[1], iconString[2]);
                    }
                    if (!colorFound) {
                        if (this.props.foreground !== undefined) {
                            this.iconColor = this.props.foreground;
                        }
                        else {
                            this.iconColor = null;
                        }
                    }
                }
            }
            else {
                this.customIcon = true;
                splittedIconData = iconData.split(',');
                this.btnIcon = splittedIconData[0];
                this.iconSize = new Size(splittedIconData[1], splittedIconData[2]);
                this.iconColor = null;
            }
        }
    }

    setIconPos(hTextPos, vTextPos) {
        if (hTextPos === 0 || (hTextPos === 1 && vTextPos === 0)) {
            this.btnIconPos = "right";
        }
        else {
            this.btnIconPos = "left";
        }
    }

    setBorderPainted(borderPainted) {
        if (borderPainted === undefined || borderPainted === true) {
            this.borderPainted = true;
        }
    }

    setBtnFocusable(focusable) {
        if (focusable === undefined || focusable === true) {
            this.focusable = true;
        }
    }

    render() {
        return (
            <div ref={r => this.button = r} style={this.props.layoutStyle}>
                <Button
                    id={this.props.id}
                    label={this.props.text}
                    constraints={this.props.constraints}
                    onClick={() => this.context.serverComm.pressButton(this.props.name)}
                    style={{
                        display: 'flex',
                        flexDirection: this.btnDirection,
                        justifyContent: this.btnAlignments.ha,
                        alignItems: this.btnAlignments.va,
                        background: this.btnBgd,
                        color: this.props.foreground,
                        borderColor: this.btnBgd,
                        paddingTop: this.btnMargins.marginTop, 
                        paddingLeft: this.btnMargins.marginLeft, 
                        paddingBottom: this.btnMargins.marginBottom, 
                        paddingRight: this.btnMargins.marginRight, 
                        fontFamily: this.btnFont.fontFamily,
                        fontWeight: this.btnFont.fontWeight,
                        fontStyle: this.btnFont.fontStyle,
                        fontSize: this.btnFont.fontSize,
                    }}
                    tabIndex={this.focusable ? this.props.tabIndex : -1}
                    icon={this.btnIcon}
                    iconPos={this.btnIconPos}
                />
            </div>
            
        )
    }
}
UIButton.contextType = RefContext
export default UIButton