import React, { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SplitButton } from "primereact/splitbutton";
import tinycolor from 'tinycolor2';
import { useButtonStyling, useComponentConstants, useEventHandler, useMouseListener } from "../../zhooks";
import { createDispatchActionRequest } from "../../../factories/RequestFactory";
import { IButton } from "..";
import { parseIconData } from "../../compprops";
import { concatClassnames, sendOnLoadCallback, parsePrefSize, parseMinSize, parseMaxSize, getFocusComponent, checkComponentName, isCompDisabled } from "../../util";
import BaseComponent from "../../BaseComponent";
import { showTopBar } from "../../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../../util/SendFocusRequests";
import { MenuItem } from "primereact/menuitem";
import { REQUEST_KEYWORDS } from "../../../request";

/** Interface for MenuButton */
export interface IMenuButton extends IButton {
    popupMenu: string;
}

/**
 * This component displays a Button which contains a dropdown menu
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIMenuButton: FC<IMenuButton> = (baseProps) => {
    /** Reference for the button element */
    const buttonRef = useRef<any>(null);

    /** Reference for the span that is wrapping the button containing layout information */
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);

    /** Component constants for contexts, properties and style */
    const [context, topbar, [props], layoutStyle, translation, compStyle] = useComponentConstants<IMenuButton>(baseProps);

    /** Style properties for the button */
    const btnStyle = useButtonStyling(props, layoutStyle, compStyle);

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = baseProps;

    /** Current state of the menuitems */
    const [items, setItems] = useState<Array<MenuItem>>();

    /** Hook for MouseListener */
    useMouseListener(props.name, buttonWrapperRef.current ? buttonWrapperRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = buttonWrapperRef.current;
        if (wrapperRef) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), wrapperRef, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

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
            let tempItems: Array<MenuItem> = [];
            foundItems.forEach(item => {
                let iconProps = parseIconData(props.foreground, item.image);
                tempItems.push({
                    label: item.text,
                    icon: iconProps.icon ? iconProps.icon : undefined,
                    style: {
                        color: iconProps.color
                    },
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
                    command: () => {
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
    useEventHandler(buttonWrapperRef.current ? buttonRef.current.defaultButton : undefined, "click", (e) => (e.target as HTMLElement).focus());
    useEventHandler(buttonWrapperRef.current ? buttonWrapperRef.current.querySelector(".p-splitbutton-menubutton") as HTMLElement : undefined, "click", (e) => (e.target as HTMLElement).focus());
    useEventHandler(buttonRef.current ? buttonRef.current.defaultButton : undefined, "blur", (e) => {
        const castedEvent = e as FocusEvent;
        if (castedEvent.relatedTarget === buttonWrapperRef.current) {
            getFocusComponent(props.name + "-wrapper", false)?.focus();
        }
    })

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
                const defaultButton = (e.target.querySelector(".p-splitbutton-defaultbutton") as HTMLElement)
                if (defaultButton) {
                    (e.target.querySelector(".p-splitbutton-defaultbutton") as HTMLElement).focus();
                }
            }}
            onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
            tabIndex={btnStyle.tabIndex}
        >
            <SplitButton
                ref={buttonRef}
                id={checkComponentName(props.name)}
                className={concatClassnames(
                    "rc-popupmenubutton",
                    props.borderPainted === false ? "border-notpainted" : '',
                    btnStyle.borderPainted && tinycolor(btnStyle.style.background?.toString()).isDark() ? "bright-button" : "dark-button",
                    `gap-${btnStyle.iconGapPos}`
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
                label={props.text}
                icon={btnStyle.iconProps ? concatClassnames(btnStyle.iconProps.icon, 'rc-button-icon') : undefined}
                disabled={isCompDisabled(props)}
                tabIndex={-1}
                model={items}
                onClick={() => buttonRef.current.show()}
                tooltip={props.toolTipText}
                tooltipOptions={{ position: "left" }} />
        </span>
    )
}
export default UIMenuButton