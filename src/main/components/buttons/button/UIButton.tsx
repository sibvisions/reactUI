import React, { FC, useLayoutEffect, useRef } from "react";
import { Button } from "primereact/button";
import tinycolor from 'tinycolor2';
import { useButtonMouseImages, useMouseListener, usePopupMenu, useComponentConstants, useButtonStyling } from "../../../hooks";
import { createDispatchActionRequest } from "../../../factories/RequestFactory";
import { IButton } from "..";
import { concatClassnames, sendOnLoadCallback, parsePrefSize, parseMinSize, parseMaxSize, checkComponentName, isCompDisabled } from "../../../util";
import { showTopBar } from "../../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../../../util/server-util/SendFocusRequests";
import { REQUEST_KEYWORDS } from "../../../request";

/**
 * This component displays a basic button
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIButton: FC<IButton> = (baseProps) => {
    /** Reference for the button element */
    const buttonRef = useRef<any>(null);

    /** Reference for the span that is wrapping the button containing layout information */
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);

    /** Component constants for contexts, properties and style */
    const [context, topbar, [props], layoutStyle, translation, compStyle] = useComponentConstants<IButton>(baseProps);

    /** Style properties for the button */
    const btnStyle = useButtonStyling(props, layoutStyle, compStyle, buttonRef.current)

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = baseProps;

    /** Hook to display mouseOverImages and mousePressedImage */
    useButtonMouseImages(btnStyle.iconProps, btnStyle.pressedIconProps, btnStyle.mouseOverIconProps, buttonRef.current ? buttonRef.current : undefined);

    /** Hook for MouseListener */
    useMouseListener(props.name, buttonWrapperRef.current ? buttonWrapperRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (buttonRef.current) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), buttonRef.current, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, props.text]);


    /** When the button is clicked, a pressButtonRequest is sent to the server with the buttons name as componentId */
    const onButtonPress = () => {
        if (props.eventAction) {
            const req = createDispatchActionRequest();
            req.componentId = props.name;
            showTopBar(context.server.sendRequest(req, REQUEST_KEYWORDS.PRESS_BUTTON), topbar);
        }
    }

    return (
        <span ref={buttonWrapperRef} style={layoutStyle}>
            <Button
                id={checkComponentName(props.name)}
                ref={buttonRef}
                className={concatClassnames(
                    "rc-button",
                    !btnStyle.borderPainted ? "border-notpainted" : "",
                    props.style?.includes("hyperlink") ? "p-button-link" : "",
                    btnStyle.borderPainted && tinycolor(btnStyle.style.background?.toString()).isDark() ? "bright-button" : "dark-button",
                    props.borderOnMouseEntered ? "mouse-border" : "",
                    `gap-${btnStyle.iconGapPos}`,
                    btnStyle.iconDirection,
                    props.parent?.includes("TB") ? "rc-toolbar-button" : "",
                    btnStyle.iconDirection && btnStyle.style.alignItems === "center" ? "no-center-gap" : "",
                    props.focusable === false ? "no-focus-rect" : ""
                )}
                style={{
                    ...btnStyle.style,
                    background: undefined,
                    borderColor: undefined,
                    '--btnJustify': btnStyle.style.justifyContent,
                    '--btnAlign': btnStyle.style.alignItems,
                    '--btnPadding': btnStyle.style.padding ? btnStyle.style.padding : undefined,
                    '--background': btnStyle.style.background,
                    '--hoverBackground': tinycolor(btnStyle.style.background?.toString()).darken(5).toString(),
                    ...(btnStyle.iconProps?.icon ? {
                        '--iconWidth': `${btnStyle.iconProps.size?.width}px`,
                        '--iconHeight': `${btnStyle.iconProps.size?.height}px`,
                        '--iconColor': btnStyle.iconProps.color,
                        '--iconImage': `url(${context.server.RESOURCE_URL + btnStyle.iconProps.icon})`,
                        '--iconTextGap': `${props.imageTextGap || 4}px`,
                        '--iconCenterGap': `${btnStyle.iconCenterGap}px`
                    } : {})
                } as any}
                label={props.text}
                aria-label={props.ariaLabel}
                icon={btnStyle.iconProps ? concatClassnames(btnStyle.iconProps.icon, 'rc-button-icon') : undefined}
                iconPos={btnStyle.iconPos}
                tabIndex={btnStyle.tabIndex}
                onClick={onButtonPress}
                onFocus={(event) => {
                    if (props.eventFocusGained) {
                        onFocusGained(props.name, context.server);
                    }
                    else {
                        if (props.focusable === false) {
                            event.preventDefault();
                        }
                    }
                }}
                onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
                disabled={isCompDisabled(props)}
                tooltip={props.toolTipText}
                tooltipOptions={{ position: "left" }}
                {...usePopupMenu(props)}
            />
        </span>
    )
}
export default UIButton;