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

import React, { CSSProperties, FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SplitButton } from "primereact/splitbutton";
import tinycolor from 'tinycolor2';
import { createDispatchActionRequest } from "../../../factories/RequestFactory";
import IBaseComponent from "../../../util/types/IBaseComponent";
import { showTopBar } from "../../topbar/TopBar";
import { handleFocusGained, onFocusLost } from "../../../util/server-util/FocusUtil";
import { MenuItem } from "primereact/menuitem";
import { IButton } from "../IButton";
import useButtonStyling from "../../../hooks/style-hooks/useButtonStyling";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import { parseIconData } from "../../comp-props/ComponentProperties";
import useEventHandler from "../../../hooks/event-hooks/useEventHandler";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { isCompDisabled } from "../../../util/component-util/IsCompDisabled";
import REQUEST_KEYWORDS from "../../../request/REQUEST_KEYWORDS";
import { IExtendableMenuButton } from "../../../extend-components/buttons/ExtendMenuButton";
import useRequestFocus from "../../../hooks/event-hooks/useRequestFocus";
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
const UIMenuButton: FC<IMenuButton & IExtendableMenuButton> = (props) => {
    /** Reference for the button element */
    const buttonRef = useRef<SplitButton>(null);

    /** Style properties for the button */
    const btnStyle = useButtonStyling(props, props.layoutStyle, props.compStyle);

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = props;

    /** Current state of the menuitems */
    const [items, setItems] = useState<Array<MenuItem>>();

    /** A state flag which changes, when the menuitems of a menubutton change to rebuild the menu */
    const [itemsChangedFlag, setItemsChangedFlag] = useState<boolean>(false);

    /** Returns the default button element (left button) of a menubutton */
    const getDefaultButton = (): HTMLElement|undefined => {
        const defaultButton = buttonRef.current?.getElement().querySelector(".p-splitbutton-defaultbutton");
        if (defaultButton) {
            return defaultButton as HTMLElement;
        }
        return undefined;
    }

    /** Returns the menu button element (right button with arrow) of a menubutton */
    const getMenuButton = (): HTMLElement|undefined => {
        const menuButton = buttonRef.current?.getElement().querySelector(".p-splitbutton-menubutton");
        if (menuButton) {
            return menuButton as HTMLElement;
        }
        return undefined;
    }

    /** Handles the requestFocus property */
    useRequestFocus(id, props.requestFocus, getDefaultButton() ? getDefaultButton() : undefined, props.context);

    /** True if the text is HTML */
    const isHTML = useIsHTMLText(props.text);

    /** Adding HTML-text to button manually */
    useLayoutEffect(() => {
        if (buttonRef.current) {
            const defaultButton = getDefaultButton();
            if (defaultButton) {
                if (isHTML) {
                    if (defaultButton.classList.contains('p-button-icon-only')) {
                        defaultButton.classList.remove('p-button-icon-only');
                    }

                    if (defaultButton.querySelector('.p-button-label')) {
                        if (props.text) {
                            defaultButton.querySelector('.p-button-label')!.innerHTML = props.text;
                        }
                        else {
                            defaultButton.querySelector('.p-button-label')!.innerHTML = "";
                        }
                    }

                    
                }
                else {
                    if (!defaultButton.classList.contains('p-button-icon-only') && !props.text) {
                        defaultButton.classList.add('p-button-icon-only');
                    }
                }
            }
        }
    }, [isHTML]);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (props.forwardedRef.current) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), props.forwardedRef.current, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, isHTML]);

    // subscribes to the menubuttons items and change the state to trigger rebuilding of the menu
    useEffect(() => {
        props.context.subscriptions.subscribeToMenuButtonItems(props.popupMenu, () => setItemsChangedFlag(prevState => !prevState));

        return () => props.context.subscriptions.unsubscribeFromMenuButtonItems(props.popupMenu);
    }, [props.context.subscriptions, props.popupMenu])

    // aria and set tabindex of right button to -1 so when the menubutton is being focused and tab is being pressed, the right button doesn't gain focus
    useLayoutEffect(() => {
        const defaultButton = getDefaultButton();
        const menuButton = getMenuButton();
        //TODO: Maybe it'll be possible to change the tabindex of the menubutton without dom manipulation in PrimeReact
        if (defaultButton && menuButton) {
            defaultButton.setAttribute("aria-haspopup", "true");
            menuButton.setAttribute("tabindex", "-1");
        }
    }, []);

    /** Builds the menuitems and sets the state */
    useEffect(() => {
        const buildMenu = (foundItems: Map<string, IBaseComponent>) => {
            let tempItems: Array<IMenuButtonItem> = [];
            foundItems.forEach(item => {
                let iconProps = parseIconData(props.foreground, item.image);
                tempItems.push({
                    id: item.id,
                    label: item.text,
                    disabled: item.enabled === false,
                    icon: iconProps.icon ? iconProps.icon : undefined,
                    style: {
                        color: iconProps.color
                    },
                    separator: item.className === "Separator",
                    template: (iconProps.icon && !iconProps.icon?.includes('fa')) ? (item, options) => {
                        return (
                            <a className="p-menuitem-link" role="menuitem" onClick={options.onClick}>
                                <img className='rc-popupmenubutton-custom-icon' src={props.context.server.RESOURCE_URL + item.icon} />
                                <span className={options.labelClassName}>{item.label}</span>
                            </a>
                        )
                    } : undefined,
                    /** When a menubuttonitem is clicked send a pressButtonRequest to the server */
                    command: (event) => {
                        if (props.onMenuItemClick) {
                            props.onMenuItemClick({ clickedItem: event.item.label, originalEvent: event.originalEvent });
                        }

                        const req = createDispatchActionRequest();
                        req.componentId = item.name;
                        showTopBar(props.context.server.sendRequest(req, REQUEST_KEYWORDS.PRESS_BUTTON), props.topbar);
                    }
                });
            });
            setItems(tempItems);
        }
        if (props.popupMenu) {
            buildMenu(props.context.contentStore.getChildren(props.popupMenu, props.className));
        }
    }, [props.context.contentStore, props.context.server, itemsChangedFlag]);

    // Focus handling, so that always the entire button is focused and not only one of the parts of the button
    useEventHandler(
        props.forwardedRef.current && getDefaultButton() ? getDefaultButton() : undefined,
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
        props.forwardedRef.current ? props.forwardedRef.current.querySelector(".p-splitbutton-menubutton") as HTMLElement : undefined,
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
            id={props.name}
            ref={props.forwardedRef}
            style={{ position: 'absolute', ...props.layoutStyle }}
            aria-label={props.ariaLabel}
            onFocus={(event) => handleFocusGained(props.name, props.className, props.eventFocusGained, props.focusable, event, props.name, props.context)}
            onBlur={props.eventFocusLost ? () => onFocusLost(props.name, props.context.server) : undefined}
            tabIndex={btnStyle.tabIndex}
        >
            <SplitButton
                ref={buttonRef}
                className={concatClassnames(
                    "rc-popupmenubutton",
                    props.borderPainted === false ? "border-notpainted" : '',
                    btnStyle.borderPainted && tinycolor(btnStyle.style.background?.toString()).isDark() ? "bright-button" : "dark-button",
                    `gap-${btnStyle.iconGapPos}`,
                    props.styleClassNames
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
                        '--iconImage': `url(${props.context.server.RESOURCE_URL + btnStyle.iconProps.icon})`,
                        '--iconTextGap': `${props.imageTextGap || 4}px`,
                    } : {})
                } as CSSProperties}
                label={!isHTML ? props.text : undefined}
                icon={btnStyle.iconProps ? concatClassnames(btnStyle.iconProps.icon, 'rc-button-icon') : undefined}
                disabled={isCompDisabled(props)}
                model={items}
                onClick={(e) => {
                    if (props.defaultMenuItem && items?.length) {
                        const foundItem = items.find(item => item.id === props.defaultMenuItem);
                        if (foundItem && foundItem.command) {
                            foundItem.command({ item: foundItem, originalEvent: e })
                        }
                    }
                    else {
                        // When the defaultbutton is being pressed, we also need to click the right button so the menu opens
                        getMenuButton()?.click();
                    }
                }}
                onShow={() => {
                    // When the popupmenu is being shown, we need to adjust the position and width, because the menu would open at a different position and with a different width
                    // With this, the menu will be starting at the same left position as the button, and is as wide as the button
                    const btnElem = buttonRef.current?.getElement();
                    const wrapperElem = btnElem?.parentElement;
                    if (btnElem && wrapperElem) {
                        setTimeout(() => {
                            const overlayElem = document.getElementById(btnElem.id + "_overlay");
                            if (overlayElem) {
                                const overlayRect = overlayElem.getBoundingClientRect();
                                const rect = wrapperElem.getBoundingClientRect();
                                overlayElem.style.left = `${rect.left}px`;
                                if (rect.width > overlayRect.width) {
                                    overlayElem.style.width = `${rect.width}px`;
                                }
                            }
                        }, 0);
                    }
                }}
                tooltip={props.toolTipText}
                tooltipOptions={{ position: "left", showDelay: 800 }}>
                    {isHTML && props.text && <RenderButtonHTML text={props.text} />}
                </SplitButton>
        </span>
    )
}
export default UIMenuButton