/** React imports */
import React, { FC, useContext, useLayoutEffect, useMemo, useRef } from "react";

/** 3rd Party imports */
import { ToggleButton } from 'primereact/togglebutton';
import tinycolor from 'tinycolor2';

/** Hook imports */
import { useProperties, useButtonMouseImages } from "../../zhooks";

/** Other imports */
import { createPressButtonRequest } from "../../../factories/RequestFactory";
import { jvxContext } from "../../../jvxProvider";
import { REQUEST_ENDPOINTS } from "../../../request";
import { LayoutContext } from "../../../LayoutContext";
import { buttonProps, getGapPos, getIconCenterDirection, IButtonSelectable } from "../";
import { concatClassnames, sendOnLoadCallback, parsePrefSize, parseMinSize, parseMaxSize } from "../../util";
import { parseIconData } from "../../compprops";

/**
 * This component displays a Button which can be toggled on and off
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIToggleButton: FC<IButtonSelectable> = (baseProps) => {
    /** Reference for the button element */
    const buttonRef = useRef<any>(null);
    /** Reference for the span that is wrapping the button containing layout information */
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IButtonSelectable>(baseProps.id, baseProps);
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
    const iconCenterGap = buttonRef.current ? buttonRef.current.container.children[1].offsetWidth/2 - buttonRef.current.container.children[0].offsetWidth/2 : 0;
    /** Data of the icon which is displayed while holding the mousebutton */
    const pressedIconData = parseIconData(props.foreground, props.mousePressedImage);
    /** Data of the icon which is displayed while moving the mouse over the button */
    const mouseOverIconData = parseIconData(props.foreground, props.mouseOverImage);
    /** Hook to display mouseOverImages and mousePressedImage */
    useButtonMouseImages(btnData.iconProps, pressedIconData, mouseOverIconData, buttonRef.current ? buttonRef.current.container : undefined);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = buttonWrapperRef.current;
        if (wrapperRef) {
            sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), wrapperRef, onLoadCallback);
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    /** When the ToggleButton is pressed, send a pressButtonRequest to the server */
    const handleOnChange = () => {
        const req = createPressButtonRequest();
        req.componentId = props.name;
        context.server.sendRequest(req, REQUEST_ENDPOINTS.PRESS_BUTTON);
    }

    return (
        <span ref={buttonWrapperRef} style={layoutValue.has(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            <ToggleButton
                ref={buttonRef}
                className={concatClassnames(
                    "rc-togglebutton",
                    !btnData.btnBorderPainted ? "border-notpainted" : '',
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
                    '--btnPadding': btnData.style.padding,
                    '--background': btnBgd,
                    '--selectedBackground': tinycolor(btnBgd).darken(10).toString(),
                    '--hoverBackground': tinycolor(btnBgd).darken(5).toString(),
                    ...(btnData.iconProps?.icon ? {
                        '--iconWidth': `${btnData.iconProps.size?.width}px`,
                        '--iconHeight': `${btnData.iconProps.size?.height}px`,
                        '--iconColor': btnData.iconProps.color,
                        '--iconImage': `url(${context.server.RESOURCE_URL + btnData.iconProps.icon})`,
                        '--iconTextGap': `${props.imageTextGap || 4}px`,
                        '--iconCenterGap': `${iconCenterGap}px`
                    } : {})
                }}
                offLabel={props.text}
                onLabel={props.text}
                offIcon={btnData.iconProps ? concatClassnames(btnData.iconProps.icon, 'rc-button-icon') : undefined}
                onIcon={btnData.iconProps ? concatClassnames(btnData.iconProps.icon, 'rc-button-icon') : undefined}
                iconPos={btnData.iconPos}
                tabIndex={btnData.tabIndex}
                checked={props.selected}
                onChange={handleOnChange}
            />
        </span>
    )
}
export default UIToggleButton