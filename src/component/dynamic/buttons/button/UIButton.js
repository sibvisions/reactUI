import React from 'react';
import './UIButton.scss'
import { Button } from "primereact/button";
import { RefContext } from '../../../helper/Context';
import BaseButton from '../BaseButton';
import { FindReact } from '../../../helper/FindReact';
import { getPreferredSize } from '../../../helper/GetPreferredSize';

class UIButton extends BaseButton {

    componentDidMount() {
        this.styleButton(this.button.children[0]);
        this.styleChildren(this.button.children[0].children, FindReact(this.button).props.className);
        this.addHoverEffect(this.button.children[0], this.btnBgd, 5);
        this.context.contentStore.emitSizeCalculated({size: getPreferredSize(this), id: this.props.id, parent: this.props.parent, firstTime: true});
    }

    render() {
        return (
            <div ref={r => this.button = r} style={this.props.layoutStyle}>
                <Button
                    {...this.btnProps}
                    label={this.props.text}
                    icon={this.iconProps ? this.iconProps.icon : null}
                />
            </div>
        )
    }
}
UIButton.contextType = RefContext
export default UIButton