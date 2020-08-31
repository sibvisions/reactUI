import React from 'react';
import { RefContext } from '../../../helper/Context';
import './UIMenuButton.scss'
import { Menu } from 'primereact/menu';
import { Button } from "primereact/button";
import { SplitButton } from "primereact/splitbutton";
import BaseButton from '../BaseButton';
import { FindReact } from '../../../helper/FindReact';
import { getPreferredSize } from '../../../helper/GetPreferredSize';
import { toPx } from '../../../helper/ToPx';

class UIMenuButton extends BaseButton {

    state = {
        items: []
    };

    componentDidMount() {
        this.styleButton(this.button.children[0]);
        this.styleChildren(this.button.children[0].children);
        this.buildMenu(this.context.contentStore.flatContent.filter(item => item.parent === this.props.popupMenu));
        this.addHoverEffect(this.button.children[0], this.btnBgd, 5);
        this.context.contentStore.emitSizeCalculated({size: getPreferredSize(this), id: this.props.id, parent: this.props.parent, firstTime: true});
    }

    styleChildren(btnChildren) {
        for (let btnChild of btnChildren) {
            if (this.props.layoutStyle !== undefined) {
                btnChild.style.setProperty('height', toPx(this.props.layoutStyle.height));
                if (btnChild.classList.contains("p-splitbutton-defaultbutton")) {
                    btnChild.style.setProperty('width', toPx(this.props.layoutStyle.width*0.8));
                    btnChild.style.setProperty('display', this.btnProps.style.display);
                    btnChild.style.setProperty('flex-direction', this.btnProps.style.flexDirection);
                    btnChild.style.setProperty('justify-content', this.btnProps.style.justifyContent);
                    btnChild.style.setProperty('align-items', this.btnProps.style.alignItems);
                }
                else if (btnChild.classList.contains("p-splitbutton-menubutton")) {
                    btnChild.style.setProperty('width', toPx(this.props.layoutStyle.width*0.2));
                }
            }
            this.menuButtonAlignments(btnChild)
            for (let child of btnChild.children) {
                if (!child.parentElement.classList.contains("p-button-icon-only") && !child.classList.value.includes("label")) {
                    let gapPos = this.getGapPos(this.props.horizontalTextPosition, this.props.verticalTextPosition);
                    child.style.setProperty('margin-' + gapPos, toPx(this.btnImgTextGap));
                }
                if (this.iconProps) {
                    if (child.classList.value.includes(this.iconProps.icon)) {
                        child.style.setProperty('width', toPx(this.iconProps.size.width));
                        child.style.setProperty('height', toPx(this.iconProps.size.height));
                        child.style.setProperty('color', this.iconProps.color);
                        if (!child.classList.value.includes('fas')) {
                            child.style.setProperty('background-image', 'url(http://localhost:8080/JVx.mobile/services/mobile/resource/demo' + this.iconProps.icon + ')');
                        }
                    }
                }
                child.style.setProperty('padding', 0);
            }
            btnChild.style.setProperty('padding', 0);
        }
    }

    buildMenu(foundItems) {
        let tempItems = [];
        foundItems.forEach(item => {
            let iconProps = this.parseIconData(item.image);
            tempItems.push({
                label: item.text,
                icon: iconProps ? iconProps.icon : null,
                id: item.id,
                className: item.id,
                style: {
                    color: iconProps.color
                },
                color: iconProps.color,
                command: () => this.context.serverComm.pressButton(item.name)
            });
        });
        this.setState({items: tempItems});
    }

    menuButtonAlignments(elem) {
        if (elem.tagName === 'I') {
            if (this.btnAlignments.ha !== 'right') {
                elem.style.setProperty('margin-left', 'auto');
            }
            if (this.btnAlignments.va !== 'center') {
                elem.style.setProperty('align-self', 'center');
            }
        }
        if (!this.iconProps.icon) {
            if (elem.classList.value.includes("p-button-label")) {
                elem.style.setProperty('margin-left', 'auto');
            }
        }
        else if (elem.classList.value.includes(this.iconProps.icon)) {
            if (this.btnAlignments.ha === 'center') {
                elem.style.setProperty('margin-left', 'auto');
            }
        }
    }

    onMainButtonClicked() {
        this.menu.show()
    }

    render() {
        return (
            <div ref={r => this.button = r} style={this.props.layoutStyle}>
                {/* <Menu
                    className="popupmenu"
                    model={this.state.items}
                    popup
                    ref={r => this.menu = r}
                    appendTo={document.body}
                />
                <Button
                    {...this.btnProps}
                    label={this.props.text}
                    icon={this.iconProps ? this.iconProps.icon : null}
                    onClick={(event) => this.menu.toggle(event)}>
                    <i className="pi pi-angle-down"></i>
                </Button> */}
                <SplitButton 
                    id={this.btnProps.id}
                    ref={r => this.menu = r}
                    label={this.props.text}
                    btnProps={this.btnProps}
                    icon={this.iconProps ? this.iconProps.icon : null}
                    onClick={() => this.onMainButtonClicked()} 
                    model={this.state.items} 
                />
            </div>
        )
    }
}
UIMenuButton.contextType = RefContext
export default UIMenuButton