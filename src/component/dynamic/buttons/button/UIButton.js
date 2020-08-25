import React from 'react';
import Base from '../../Base';
import './UIButton.scss'
import { Button } from "primereact/button";
import { ToggleButton } from 'primereact/togglebutton';
import { RefContext } from '../../../helper/Context';
import { Size } from '../../../helper/Size';
import { toPx } from '../../../helper/ToPx';
import tinycolor from 'tinycolor2';

class UIButton extends Base {

    btnMargins;
    btnAlignments;
    btnDirection;
    btnFont;
    iconProps = {};
    btnIconPos;
    btnImgTextGap;
    customIcon = false;
    btnBgd;
    btnBgdChecked;
    borderPainted = false;
    focusable = false;

    constructor(props) {
        super(props);
        this.btnMargins = this.getMargins();
        this.btnAlignments = this.getAlignments();
        this.setBtnDirection(props.horizontalTextPosition);
        this.btnFont = this.getFont();
        this.iconProps = this.parseIconData(props.image);
        this.setIconPos(props.horizontalTextPosition, this.props.verticalTextPosition);
        this.btnImgTextGap = this.getImageTextGap();
        this.btnBgd = this.getBtnBgdColor();
        this.setBorderPainted(props.borderPainted);
        this.setBtnFocusable(props.focusable);
        if (this.btnBgd !== undefined) {
            this.btnBgdChecked = this.btnBgd.clone().darken(10)
            this.state = {
                checked: false,
                bgd: this.btnBgd
            }
        }
        
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
            if (this.iconProps.icon !== undefined) {
                if (child.classList.contains('fa-' + this.iconProps.icon.substring(this.iconProps.icon.indexOf('-') + 1)) || child.classList.contains(this.iconProps.icon)) {
                    child.style.setProperty('width', toPx(this.iconProps.size.width));
                    child.style.setProperty('height', toPx(this.iconProps.size.height));
                    child.style.setProperty('color', this.iconProps.color);
                    if (child.classList.contains(this.iconProps.icon)) {
                        child.classList.add("custom-icon");
                        child.style.setProperty('--icon', 'url(' + this.iconProps.icon + ')');
                    }
                    let gapPos = this.getGapPos(this.props.horizontalTextPosition, this.props.verticalTextPosition);
                    child.style.setProperty('margin-' + gapPos, toPx(this.btnImgTextGap));
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
                if (this.state.checked) {
                    obj.style.setProperty('background', this.btnBgdChecked)
                    obj.style.setProperty('border-color', this.btnBgdChecked)
                }
                else {
                    obj.style.setProperty('background', color)
                    obj.style.setProperty('border-color', color)
                }
                
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
        if (this.props.className === 'ToggleButton') {
            return (
                <div ref={r => this.button = r} style={this.props.layoutStyle}>
                    <ToggleButton
                        id={this.props.id}
                        offLabel={this.props.text}
                        onLabel={this.props.text}
                        constraints={this.props.constraints}
                        onClick={() => this.context.serverComm.pressButton(this.props.name)}
                        style={{
                            display: 'flex',
                            flexDirection: this.btnDirection,
                            justifyContent: this.btnAlignments.ha,
                            alignItems: this.btnAlignments.va,
                            background: this.state.bgd,
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
                        offIcon={this.iconProps.icon}
                        onIcon={this.iconProps.icon}
                        iconPos={this.btnIconPos}
                        checked={this.state.checked}
                        onChange={(e) => {
                            console.log((e.value ? this.btnBgdChecked : this.btnBgd).toHex())
                            this.setState({checked: e.value, bgd: e.value ? this.btnBgdChecked : this.btnBgd})
                        } }
                    />
                </div>
            )
        }
        else {
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
                        icon={this.iconProps.icon}
                        iconPos={this.btnIconPos}
                    />
                </div>
            )
        }
    }
}
UIButton.contextType = RefContext
export default UIButton