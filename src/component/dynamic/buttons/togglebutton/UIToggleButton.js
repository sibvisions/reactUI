import React from 'react';
import { ToggleButton } from 'primereact/togglebutton';
import { RefContext } from '../../../helper/Context';
import tinycolor from 'tinycolor2';
import BaseButton from '../BaseButton';
import { FindReact } from '../../../helper/FindReact';
import { getPreferredSize } from '../../../helper/GetPreferredSize';

class UIToggleButton extends BaseButton {

    constructor(props) {
        super(props);
        if (this.btnBgd !== undefined) {
            this.btnBgdChecked = this.props.background !== undefined ? 
            tinycolor(this.props.background).darken(10) : tinycolor("#007ad9").darken(10)
            this.state = {
                checked: false,
                bgd: this.btnBgd
            }
        }
    }

    componentDidMount() {
        this.styleButton(this.button.children[0]);
        this.styleChildren(this.button.children[0].children, FindReact(this.button).props.className)
        this.addHoverEffect(this.button.children[0], this.btnBgd, 5)
        this.context.contentStore.emitSizeCalculated({size: getPreferredSize(this), id: this.props.id, parent: this.props.parent, firstTime: true});
    }

    addHoverEffect(obj, color, dark) {
        if ((this.props.borderOnMouseEntered && this.borderPainted) || (!this.props.borderOnMouseEntered && this.borderPainted)) {
            obj.onmouseover = () => {
                obj.style.setProperty('background', tinycolor(color.getOriginalInput()).darken(dark))
                obj.style.setProperty('border-color', tinycolor(color.getOriginalInput()).darken(dark))
            }
            obj.onmouseout = () => {
                if (this.state.checked) {
                    obj.style.setProperty('background', this.btnBgdChecked)
                    obj.style.setProperty('border-color', this.btnBgdChecked)
                }
                else {
                    obj.style.setProperty('background', color.getOriginalInput())
                    obj.style.setProperty('border-color', color.getOriginalInput())
                }
                
            }
        }
        else if (this.props.borderOnMouseEntered && !this.borderPainted) {
            obj.onmouseover = () => {
                obj.style.setProperty('background', this.props.background !== undefined ? this.props.background : "#007ad9")
                obj.style.setProperty('border-color', this.props.background !== undefined ? this.props.background : "#007ad9")
            }
            obj.onmouseout = () => {
                if (this.state.checked) {
                    obj.style.setProperty('background', this.btnBgdChecked)
                    obj.style.setProperty('border-color', this.btnBgdChecked)
                }
                else {
                    obj.style.setProperty('background', this.btnBgd)
                    obj.style.setProperty('border-color', this.btnBgd)
                }
            }
        }
    }

    render() {
        return (
            <div ref={r => this.button = r} style={this.props.layoutStyle}>
                <ToggleButton
                    {...this.btnProps}
                    offLabel={this.props.text}
                    onLabel={this.props.text}
                    offIcon={this.iconProps.icon}
                    onIcon={this.iconProps.icon}
                    checked={this.state.checked}
                    onChange={(e) => {
                        console.log((e.value ? this.btnBgdChecked : this.btnBgd).toHex())
                        this.setState({ checked: e.value, bgd: e.value ? this.btnBgdChecked : this.btnBgd })
                    }}
                />
            </div>
        )
    }
}
UIToggleButton.contextType = RefContext
export default UIToggleButton