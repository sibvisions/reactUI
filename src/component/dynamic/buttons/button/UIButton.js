import React from 'react';
import './UIButton.scss'
import { Button } from "primereact/button";
import { RefContext } from '../../../helper/Context';
import tinycolor from 'tinycolor2';
import BaseButton from '../BaseButton';

class UIButton extends BaseButton {

    componentDidMount() {
        this.styleButton(this.button.children[0]);
        this.styleChildren(this.button.children[0].children);
        this.addHoverEffect(this.button.children[0], this.btnBgd, 5)
    }

    addHoverEffect(obj, color, dark) {
        if ((this.props.borderOnMouseEntered && this.borderPainted) || (!this.props.borderOnMouseEntered && this.borderPainted)) {
            obj.onmouseover = () => {
                obj.style.setProperty('background', tinycolor(color.getOriginalInput()).darken(dark))
                obj.style.setProperty('border-color', tinycolor(color.getOriginalInput()).darken(dark))
            }
            obj.onmouseout = () => {
                obj.style.setProperty('background', color.getOriginalInput())
                obj.style.setProperty('border-color', color.getOriginalInput())  
            }
        }
        else if (this.props.borderOnMouseEntered && !this.borderPainted) {
            obj.onmouseover = () => {
                console.log('hover')
                obj.style.setProperty('background', this.props.background !== undefined ? this.props.background : "#007ad9")
                obj.style.setProperty('border-color', this.props.background !== undefined ? this.props.background : "#007ad9")
            }
            obj.onmouseout = () => {
                obj.style.setProperty('background', this.btnBgd)
                obj.style.setProperty('border-color', this.btnBgd)
            }
        }
    }

    render() {
        return (
            <div ref={r => this.button = r} style={this.props.layoutStyle}>
                <Button
                    {...this.btnProps}
                    label={this.props.text}
                    icon={this.iconProps.icon}
                />
            </div>
        )
    }
}
UIButton.contextType = RefContext
export default UIButton