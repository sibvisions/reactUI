import React from 'react';
import { RefContext } from '../../../helper/Context';
import './UIMenuButton.scss'
import { SplitButton } from "primereact/splitbutton";
import BaseButton from '../BaseButton';
import { getPreferredSize } from '../../../helper/GetSizes';
import { toPx } from '../../../helper/ToPx';
import { parseIconData } from '../../ComponentProperties';

class UIMenuButton extends BaseButton {

    state = {
        items: []
    };

    componentDidMount() {
        this.styleButton(this.button.children[0]);
        this.styleChildren(this.button.children[0].children);
        this.buildMenu(this.context.contentStore.flatContent.filter(item => item.parent === this.props.popupMenu));
        this.addHoverEffect(this.button.children[0].children[0], this.btnBgd, 5);
        this.addHoverEffect(this.button.children[0].children[1], this.btnBgd, 5);

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

    styleChildren(btnChildren) {
        for (let btnChild of btnChildren) {
            if (this.props.layoutStyle !== undefined) {
                btnChild.style.setProperty('height', toPx(this.props.layoutStyle.height));
                btnChild.style.setProperty('padding-top', toPx(this.btnProps.style.paddingTop));
                btnChild.style.setProperty('padding-left', toPx(this.btnProps.style.paddingLeft));
                btnChild.style.setProperty('padding-bottom', toPx(this.btnProps.style.paddingBottom));
                btnChild.style.setProperty('padding-right', toPx(this.btnProps.style.paddingRight));
                if (btnChild.classList.contains("p-splitbutton-defaultbutton")) {
                    btnChild.style.setProperty('width', !(this.props.layoutStyle.width+'').includes('%') ? toPx(this.props.layoutStyle.width-38) : 'calc(100% - 38px)');
                    btnChild.style.setProperty('display', this.btnProps.style.display);
                    btnChild.style.setProperty('flex-direction', this.btnProps.style.flexDirection);
                    btnChild.style.setProperty('justify-content', this.btnProps.style.justifyContent);
                    btnChild.style.setProperty('align-items', this.btnProps.style.alignItems);
                }
                else if (btnChild.classList.contains("p-splitbutton-menubutton")) {
                    btnChild.style.setProperty('width', '38px');
                    
                }
            }
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
        }
    }

    buildMenu(foundItems) {
        let tempItems = [];
        foundItems.forEach(item => {
            let iconProps = parseIconData(item.props, item.image);
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

    onMainButtonClicked() {
        this.menu.show()
    }

    render() {
        return (
            <div ref={r => this.button = r} style={this.props.layoutStyle}>
                <SplitButton 
                    id={this.btnProps.id}
                    ref={r => this.menu = r}
                    label={this.props.text}
                    style={{background: this.btnProps.style.background, borderColor: this.btnProps.style.borderColor, borderRadius: '3px'}}
                    btnProps={this.btnProps}
                    icon={this.iconProps ? this.iconProps.icon : null}
                    onClick={() => this.onMainButtonClicked()} 
                    model={this.state.items}
                    tabIndex={this.btnProps.tabIndex}
                />
            </div>
        )
    }
}
UIMenuButton.contextType = RefContext
export default UIMenuButton