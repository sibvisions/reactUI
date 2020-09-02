import React from 'react';
import './UIButton.scss'
import { Button } from "primereact/button";
import { RefContext } from '../../../helper/Context';
import BaseButton from '../BaseButton';
import { FindReact } from '../../../helper/FindReact';
import { getPreferredSize } from '../../../helper/GetSizes';

class UIButton extends BaseButton {

    componentDidMount() {
        this.styleButton(this.button.children[0]);
        this.styleChildren(this.button.children[0].children, FindReact(this.button).props.className);
        this.addHoverEffect(this.button.children[0], this.btnBgd, 5);

        window.addEventListener("resize", () => {
            if (this.button !== null) {
                this.styleButton(this.button.children[0])
            }
        })

        this.context.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize({
                    id: this.props.id, 
                    preferredSize: this.props.preferredSize,
                    horizontalTextPosition: this.props.horizontalTextPosition,
                    minimumSize: this.props.minimumSize,
                    maximumSize: this.props.maximumSize
                }), 
                id: this.props.id, 
                parent: this.props.parent
            }
        );
    }

    componentWillUnmount() {
        window.removeEventListener("resize", () => {
            this.styleButton(this.button.children[0])
        })
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