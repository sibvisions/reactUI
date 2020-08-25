import React from 'react';
import { RefContext } from '../../../helper/Context';
import { Menu } from 'primereact/menu';
import { Button } from "primereact/button";
import BaseButton from '../BaseButton';

class UIMenuButton extends BaseButton {

    state = {
        items: []
    };

    componentDidMount() {
        this.styleButton(this.button.children[0]);
        this.styleChildren(this.button.children[0].children);
        this.buildMenu(this.context.contentStore.flatContent.filter(item => item.parent === this.props.popupMenu));
    }

    buildMenu(foundItems) {
        let tempItems = [];
        foundItems.forEach(item => {
            let iconProps = this.parseIconData(item.image);
            tempItems.push({
                label: item.text,
                icon: iconProps.icon,
                id: item.id,
                size: iconProps.size,
                color: iconProps.color
            });
        });
        this.setState({items: tempItems});
    }

    render() {
        return (
            <div ref={r => this.button = r} style={this.props.layoutStyle}>
                <Menu model={this.state.items} popup ref={r => this.menu = r} appendTo={document.body}/>
                <Button {...this.btnProps} label={this.props.text} onClick={(event) => this.menu.toggle(event)}><i className="pi pi-angle-down"></i> </Button>
                
            </div>
        )
    }
}
UIMenuButton.contextType = RefContext
export default UIMenuButton