import React from 'react';
import { RefContext } from '../../../helper/Context';
import Base from '../../Base';

import { Menu } from 'primereact/menu';
import { Button } from "primereact/button";

class UIMenuButton extends Base {

    state = {
        items: []
    };

    btnMargins;
    btnAlignments
    btnBgd;

    constructor(props) {
        super(props);

    }

    componentDidMount() {
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
            <span id={this.props.id} style={this.props.layoutStyle}>
                <Menu model={this.state.items} popup ref={r => this.menu = r} appendTo={document.body}/>
                <Button label={this.props.text} onClick={(event) => this.menu.toggle(event)}/>
            </span>
        )
    }
}
UIMenuButton.contextType = RefContext
export default UIMenuButton