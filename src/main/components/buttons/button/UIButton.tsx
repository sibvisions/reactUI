/** React imports */
import React, { FC, useContext, useLayoutEffect, useMemo, useRef } from "react";

/** 3rd Party imports */
import { Button } from "primereact/button";
import tinycolor from 'tinycolor2';

/** Hook imports */
import { useProperties, useButtonMouseImages, useLayoutValue, useMouseListener } from "../../zhooks";

/** Other imports */
import { createPressButtonRequest } from "../../../factories/RequestFactory";
import { appContext } from "../../../AppProvider";
import { REQUEST_ENDPOINTS } from "../../../request";
import { IButton, buttonProps, getGapPos, getIconCenterDirection } from "..";
import { concatClassnames, sendOnLoadCallback, parsePrefSize, parseMinSize, parseMaxSize } from "../../util";
import { parseIconData } from "../../compprops";
import { showTopBar, TopBarContext } from "../../topbar/TopBar";

/**
 * This component displays a basic button
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIButton: FC<IButton> = (baseProps) => {
    /** Reference for the button element */
    const buttonRef = useRef<any>(null);
    /** Reference for the span that is wrapping the button containing layout information */
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IButton>(baseProps.id, baseProps);
    /** Information on how to display the button, refreshes everytime the props change */
    const btnData = useMemo(() => buttonProps(props), [props]);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** Button Background either server set or default */
    const btnBgd = btnData.style.background as string || window.getComputedStyle(document.documentElement).getPropertyValue('--btnDefaultBgd');
    /** Server set or default horizontal alignment */
    const btnHAlign = btnData.style.justifyContent || "center";
    /** Server set or default vertical alignment */
    const btnVAlign = btnData.style.alignItems || "center";
    /** On which side of the side of the label, the gap between icon and label should be */
    const gapPos = getGapPos(props.horizontalTextPosition, props.verticalTextPosition);
    /** The amount of pixels to center the icon or radiobutton/checkbox respective to the label is hTextPos = 1 */
    const iconCenterGap = buttonRef.current ? buttonRef.current.element.children[1].offsetWidth/2 - buttonRef.current.element.children[0].offsetWidth/2 : 0;
    /** Data of the icon which is displayed while holding the mousebutton */
    const pressedIconData = parseIconData(props.foreground, props.mousePressedImage);
    /** Data of the icon which is displayed while moving the mouse over the button */
    const mouseOverIconData = parseIconData(props.foreground, props.mouseOverImage);
    /** Hook to display mouseOverImages and mousePressedImage */
    useButtonMouseImages(btnData.iconProps, pressedIconData, mouseOverIconData, buttonRef.current ? buttonRef.current.element : undefined);
    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id);
    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);
    /** Hook for MouseListener */
    useMouseListener(props.name, buttonWrapperRef.current ? buttonWrapperRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = buttonWrapperRef.current;
        if (wrapperRef)
            sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), wrapperRef, onLoadCallback);

    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);


    /** When the button is clicked, a pressButtonRequest is sent to the server with the buttons name as componentId */
    const onButtonPress = () => {
        const req = createPressButtonRequest();
        req.componentId = props.name;
        showTopBar(context.server.sendRequest(req, REQUEST_ENDPOINTS.PRESS_BUTTON), topbar);
    }

    return(
        <span ref={buttonWrapperRef} style={layoutStyle}>
            <Button
                id={props.name}
                ref={buttonRef}
                className={concatClassnames(
                    "rc-button",
                    !btnData.btnBorderPainted ? "border-notpainted" : '',
                    props.style?.includes("hyperlink") ? "p-button-link" : '',
                    btnData.btnBorderPainted && tinycolor(btnBgd).isDark() ? "bright" : "dark",
                    props.borderOnMouseEntered ? "mouse-border" : '',
                    `gap-${gapPos}`,
                    getIconCenterDirection(props.horizontalTextPosition, props.horizontalAlignment)
                )}
                style={{
                    ...btnData.style,
                    background: undefined,
                    borderColor: undefined,
                    '--btnJustify': btnHAlign, 
                    '--btnAlign': btnVAlign,
                    '--btnPadding': btnData.style.padding ? btnData.style.padding : undefined,
                    '--background': btnBgd,
                    '--hoverBackground': tinycolor(btnBgd).darken(5).toString(),
                    ...(btnData.iconProps?.icon ? {
                        '--iconWidth': `${btnData.iconProps.size?.width}px`,
                        '--iconHeight': `${btnData.iconProps.size?.height}px`,
                        '--iconColor': btnData.iconProps.color,
                        '--iconImage': `url(${context.server.RESOURCE_URL + btnData.iconProps.icon})`,
                        '--iconTextGap': `${props.imageTextGap || 4}px`,
                        '--iconCenterGap': `${iconCenterGap}px`
                    } : {})
                } as any}
                label={props.text}
                aria-label={props.ariaLabel}
                icon={btnData.iconProps ? concatClassnames(btnData.iconProps.icon, 'rc-button-icon') : undefined}
                iconPos={btnData.iconPos}
                tabIndex={btnData.tabIndex}
                onClick={onButtonPress}
                disabled={props.enabled === false}
            />
        </span>
    )
}
export default UIButton;