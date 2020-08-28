import React from 'react';
import { RefContext } from '../../../helper/Context';
import './UIMenuButton.scss'
import { Menu } from 'primereact/menu';
import { Button } from "primereact/button";
import BaseButton from '../BaseButton';
import { FindReact } from '../../../helper/FindReact';
import { getPreferredSize } from '../../../helper/GetPreferredSize';

class UIMenuButton extends BaseButton {

    state = {
        items: []
    };

    componentDidMount() {
        this.styleButton(this.button.children[0]);
        this.styleChildren(this.button.children[0].children, FindReact(this.button).props.className);
        this.buildMenu(this.context.contentStore.flatContent.filter(item => item.parent === this.props.popupMenu));
        this.addHoverEffect(this.button.children[0], this.btnBgd, 5);
        this.context.contentStore.emitSizeCalculated({size: getPreferredSize(this), id: this.props.id, parent: this.props.parent, firstTime: true});
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

    render() {
        return (
            <div ref={r => this.button = r} style={this.props.layoutStyle}>
                <Menu
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
                </Button>
            </div>
        )
    }
}
UIMenuButton.contextType = RefContext
export default UIMenuButton