/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SplitButton } from "primereact/splitbutton";
import tinycolor from 'tinycolor2';
import { createDispatchActionRequest } from "../../../factories/RequestFactory";
import BaseComponent from "../../../util/types/BaseComponent";
import { showTopBar } from "../../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../../../util/server-util/SendFocusRequests";
import { MenuItem } from "primereact/menuitem";
import { IButton } from "../IButton";
import useComponentConstants from "../../../hooks/components-hooks/useComponentConstants";
import useButtonStyling from "../../../hooks/style-hooks/useButtonStyling";
import useMouseListener from "../../../hooks/event-hooks/useMouseListener";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import { parseIconData } from "../../comp-props/ComponentProperties";
import useEventHandler from "../../../hooks/event-hooks/useEventHandler";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { isCompDisabled } from "../../../util/component-util/IsCompDisabled";
import REQUEST_KEYWORDS from "../../../request/REQUEST_KEYWORDS";
import { IExtendableMenuButton } from "../../../extend-components/buttons/ExtendMenuButton";
import useRequestFocus from "../../../hooks/event-hooks/useRequestFocus";
import useHandleDesignerUpdate from "../../../hooks/style-hooks/useHandleDesignerUpdate";
import useDesignerUpdates from "../../../hooks/style-hooks/useDesignerUpdates";
import useIsHTMLText from "../../../hooks/components-hooks/useIsHTMLText";
import { RenderButtonHTML } from "../button/UIButton";

/** Interface for MenuButton */
export interface IMenuButton extends IButton {
    popupMenu: string
    defaultMenuItem: string
}

interface IMenuButtonItem extends MenuItem {
    id: string
}

/**
 * This component displays a Button which contains a dropdown menu
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIMenuButton: FC<IMenuButton & IExtendableMenuButton> = (baseProps) => {
    /** Reference for the button element */
    const buttonRef = useRef<any>(null);

    /** Reference for the span that is wrapping the button containing layout information */
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);

    /** Component constants for contexts, properties and style */
    const [context, topbar, [props], layoutStyle, compStyle] = useComponentConstants<IMenuButton & IExtendableMenuButton>(baseProps);

    /** Style properties for the button */
    const btnStyle = useButtonStyling(props, layoutStyle, compStyle);

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = baseProps;

    /** Current state of the menuitems */
    const [items, setItems] = useState<Array<MenuItem>>();

    /** Hook for MouseListener */
    useMouseListener(props.name, buttonWrapperRef.current ? buttonWrapperRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** Handles the requestFocus property */
    useRequestFocus(id, props.requestFocus, buttonRef.current ? buttonRef.current.defaultButton : undefined, context);

    /** Subscribes to designer-changes so the components are updated live */
    const designerUpdate = useDesignerUpdates("menubutton");

    /** True if the text is HTML */
    const isHTML = useIsHTMLText(props.text);

    /** Adding HTML-text to button manually */
    useLayoutEffect(() => {
        if (buttonRef.current) {
            if (isHTML) {
                if (buttonRef.current.defaultButton.classList.contains('p-button-icon-only')) {
                    buttonRef.current.defaultButton.classList.remove('p-button-icon-only');
                }
                buttonRef.current.defaultButton.querySelector('.p-button-label').innerHTML = props.text;
            }
            else {
                if (!buttonRef.current.defaultButton.classList.contains('p-button-icon-only') && !props.text) {
                    buttonRef.current.defaultButton.classList.add('p-button-icon-only');
                }
            }
        }
    }, [isHTML])

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = buttonWrapperRef.current;
        if (wrapperRef) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), wrapperRef, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, designerUpdate, isHTML]);

    /** Retriggers the size-measuring and sets the layoutstyle to the component */
    useHandleDesignerUpdate(
        designerUpdate,
        buttonWrapperRef.current,
        layoutStyle,
        (clone: HTMLElement) => sendOnLoadCallback(
            id,
            props.className,
            parsePrefSize(props.preferredSize),
            parseMaxSize(props.maximumSize),
            parseMinSize(props.minimumSize),
            clone,
            onLoadCallback),
        onLoadCallback
    );

    useLayoutEffect(() => {
        //TODO: Maybe it'll be possible to change the tabindex of the menubutton without dom manipulation in PrimeReact
        if (buttonRef.current) {
            buttonRef.current.defaultButton.setAttribute("aria-haspopup", true);
            (buttonRef.current.container.querySelector(".p-splitbutton-menubutton") as HTMLElement).setAttribute("tabindex", "-1");
        }
    }, [])

    /** Builds the menuitems and sets the state */
    useEffect(() => {
        const buildMenu = (foundItems: Map<string, BaseComponent>) => {
            let tempItems: Array<IMenuButtonItem> = [];
            foundItems.forEach(item => {
                let iconProps = parseIconData(props.foreground, item.image);
                tempItems.push({
                    id: item.id,
                    label: item.text,
                    icon: iconProps.icon ? iconProps.icon : undefined,
                    style: {
                        color: iconProps.color
                    },
                    separator: item.className === "Separator",
                    template: (iconProps.icon && !iconProps.icon?.includes('fa')) ? (item, options) => {
                        return (
                            <a className="p-menuitem-link" role="menuitem" onClick={options.onClick}>
                                <img className='rc-popupmenubutton-custom-icon' src={context.server.RESOURCE_URL + item.icon} />
                                <span className={options.labelClassName}>{item.label}</span>
                            </a>
                        )
                    } : undefined,
                    color: iconProps.color,
                    /** When a menubuttonitem is clicked send a pressButtonRequest to the server */
                    command: (event) => {
                        if (props.onMenuItemClick) {
                            props.onMenuItemClick({ clickedItem: event.item.label, originalEvent: event.originalEvent });
                        }

                        const req = createDispatchActionRequest();
                        req.componentId = item.name;
                        showTopBar(context.server.sendRequest(req, REQUEST_KEYWORDS.PRESS_BUTTON), topbar);
                    }
                });
            });
            setItems(tempItems);
        }
        if (props.popupMenu) {
            buildMenu(context.contentStore.getChildren(props.popupMenu, props.className));
        }
    }, [context.contentStore, context.server, props]);

    // Focus handling, so that always the entire button is focused and not only one of the parts of the button
    useEventHandler(
        buttonWrapperRef.current ? buttonRef.current.defaultButton : undefined,
        "click",
        (event) => {
            (event.target as HTMLElement).focus();

            if (props.onDefaultBtnClick) {
                props.onDefaultBtnClick(event as MouseEvent);
            }
        }
    );

    // If lib-user extends MenuButton with onMenuBtnClick, call it when the MenuButton is clicked (right side of SplitButton)
    useEventHandler(
        buttonWrapperRef.current ? buttonWrapperRef.current.querySelector(".p-splitbutton-menubutton") as HTMLElement : undefined,
        "click",
        (event) => {
            (event.target as HTMLElement).focus();

            if (props.onMenuBtnClick) {
                props.onMenuBtnClick(event as MouseEvent);
            }
        }
    );

    return (
        <span
            className={concatClassnames("rc-popupmenubutton-wrapper", props.focusable === false ? "no-focus-rect" : "")}
            id={props.name + "-wrapper"}
            ref={buttonWrapperRef}
            style={{ position: 'absolute', ...layoutStyle }}
            aria-label={props.ariaLabel}
            onFocus={(e) => {
                if (props.eventFocusGained) {
                    onFocusGained(props.name, context.server)
                }
            }}
            onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
            tabIndex={btnStyle.tabIndex}
        >
            <SplitButton
                ref={buttonRef}
                id={props.name}
                className={concatClassnames(
                    "rc-popupmenubutton",
                    props.borderPainted === false ? "border-notpainted" : '',
                    btnStyle.borderPainted && tinycolor(btnStyle.style.background?.toString()).isDark() ? "bright-button" : "dark-button",
                    `gap-${btnStyle.iconGapPos}`,
                    props.style
                )}
                style={{
                    ...btnStyle.style,
                    padding: '0',
                    background: undefined,
                    borderColor: undefined,
                    '--menuBtnJustify': btnStyle.style.justifyContent,
                    '--menuBtnAlign': btnStyle.style.alignItems,
                    '--menuBtnPadding': btnStyle.style.padding,
                    '--background': btnStyle.style.background,
                    '--hoverBackground': tinycolor(btnStyle.style.background?.toString()).darken(5).toString(),
                    ...(btnStyle.iconProps?.icon ? {
                        '--iconWidth': `${btnStyle.iconProps.size?.width}px`,
                        '--iconHeight': `${btnStyle.iconProps.size?.height}px`,
                        '--iconColor': btnStyle.iconProps.color,
                        '--iconImage': `url(${context.server.RESOURCE_URL + btnStyle.iconProps.icon})`,
                        '--iconTextGap': `${props.imageTextGap || 4}px`,
                    } : {})
                }}
                label={!isHTML ? props.text : undefined}
                icon={btnStyle.iconProps ? concatClassnames(btnStyle.iconProps.icon, 'rc-button-icon') : undefined}
                disabled={isCompDisabled(props)}
                //tabIndex={-1}
                model={items}
                onClick={(e) => {
                    if (props.defaultMenuItem && items?.length) {
                        const foundItem = items.find(item => item.id === props.defaultMenuItem);
                        if (foundItem && foundItem.command) {
                            foundItem.command({ item: foundItem, originalEvent: e })
                        }
                    }
                    else {
                        buttonRef.current.show()
                    }
                }}
                tooltip={props.toolTipText}
                tooltipOptions={{ position: "left" }}>
                    {isHTML && props.text && <RenderButtonHTML text={props.text} />}
                </SplitButton>
        </span>
    )
}
export default UIMenuButton