/** React imports */
import React, {FC, useContext, useLayoutEffect, useMemo, useRef} from "react";

/** 3rd Party imports */
import {ToggleButton} from 'primereact/togglebutton';
import tinycolor from 'tinycolor2';

/** Hook imports */
import useProperties from "../../zhooks/useProperties";

/** Other imports */
import {createPressButtonRequest} from "../../../factories/RequestFactory";
import {jvxContext} from "../../../jvxProvider";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import {LayoutContext} from "../../../LayoutContext";
import {IButtonSelectable} from "../IButton";
import {addHoverEffect, buttonProps, centerElem, getGapPos, renderButtonIcon} from "../ButtonStyling";
import {sendOnLoadCallback} from "../../util/sendOnLoadCallback";
import {parseIconData} from "../../compprops/ComponentProperties";
import {parseJVxSize} from "../../util/parseJVxSize";
import { cn } from "../menubutton/UIMenuButton";

/** Interface fot ToggleButtons */
export interface IToggleButton extends IButtonSelectable {
    mousePressedImage: string;
}

/**
 * This component displays a Button which can be toggled on and off
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIToggleButton: FC<IToggleButton> = (baseProps) => {
    /** Reference for the button element */
    const buttonRef = useRef<any>(null);
    /** Reference for the span that is wrapping the button containing layout information */
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IToggleButton>(baseProps.id, baseProps);
    /** Information on how to display the button, refreshes everytime the props change */
    const btnData = useMemo(() => buttonProps(props), [props]);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** Button Background either server set or default */
    const btnBgd = btnData.style.background as string || window.getComputedStyle(document.documentElement).getPropertyValue('--btnDefaultBgd');
    /** Data of the icon which is displayed while holding the mousebutton */
    const pressedIconData = parseIconData(props.foreground, props.mousePressedImage)
    /** Server set or default horizontal alignment */
    const btnHAlign = btnData.style.justifyContent || "center";
    /** Server set or default vertical alignment */
    const btnVAlign = btnData.style.alignItems || "center";
        /** On which side of the side of the label, the gap between icon and label should be */
        const gapPos = getGapPos(props.horizontalTextPosition, props.verticalTextPosition);
        /** The amount of pixels to put  */
        const iconCenterGap = buttonRef.current ? buttonRef.current.container.children[1].offsetWidth/2 - buttonRef.current.container.children[0].offsetWidth/2 : 0

        /** 
     * Adding eventListener for mouse pressing to display the mousePressImage received by the server
     * apply all server sent styling and add a custom hover effect to the ToggleButton
     * @returns removing eventListeners on unmount
     */
    useLayoutEffect(() => {
        const handleMouseImagePressed = (elem:HTMLElement) => {
            if (pressedIconData.icon?.includes('fa fa-')) {
                elem.classList.remove((btnData.iconProps.icon as string).substring(3));
                elem.classList.add(pressedIconData.icon.substring(3));
            }
            else
                elem.style.setProperty('--iconImage', 'url(' + context.server.RESOURCE_URL + pressedIconData.icon + ')');
        }

        const handleMouseImageReleased = (elem:HTMLElement) => {
            if (pressedIconData.icon?.includes('fa fa-')) {
                elem.classList.remove(pressedIconData.icon.substring(3));
                elem.classList.add((btnData.iconProps.icon as string).substring(3))
            }
            else
                elem.style.setProperty('--iconImage', 'url(' + context.server.RESOURCE_URL + btnData.iconProps.icon + ')');
        }

        if (buttonRef.current) {
            const btnContainer = buttonRef.current.container;
            if (btnData.iconProps.icon) {
                const iconElement = btnContainer.children[0] as HTMLElement;
                //renderButtonIcon(iconElement, props, btnData.iconProps, context.server.RESOURCE_URL);
                if (props.horizontalTextPosition === 1)
                    centerElem(btnContainer.children[0], btnContainer.children[1], props.horizontalAlignment)
                if (pressedIconData.icon) {
                    btnContainer.addEventListener('mousedown', () => handleMouseImagePressed(iconElement));
                    btnContainer.addEventListener('mouseup', () => handleMouseImageReleased(iconElement));
                    btnContainer.addEventListener('mouseout', () => handleMouseImageReleased(iconElement));
                }
            }
            //(btnData.btnBorderPainted && tinycolor(btnBgd).isDark()) ? btnContainer.classList.add("bright") : btnContainer.classList.add("dark");
            //addHoverEffect(btnContainer as HTMLElement, props.borderOnMouseEntered,
            //btnBgd, tinycolor(btnBgd).darken(10).toString(), 5, btnData.btnBorderPainted, props.selected, props.background ? true : false);
        }
        return () => {
            if (buttonRef.current && btnData.iconProps.icon && pressedIconData.icon) {
                const btnContainer = buttonRef.current.container;
                if (btnContainer) {
                    const iconElement = btnContainer.children[0] as HTMLElement
                    btnContainer.removeEventListener('mousedown', () => handleMouseImagePressed(iconElement));
                    btnContainer.removeEventListener('mouseup', () => handleMouseImageReleased(iconElement));
                    btnContainer.removeEventListener('mouseout', () => handleMouseImageReleased(iconElement));
                }
            }
        }
    },[props.selected, btnBgd, btnData.btnBorderPainted, btnData.iconProps, btnData.style, props, context.server.RESOURCE_URL, pressedIconData.icon]);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = buttonWrapperRef.current;
        if (wrapperRef) {
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), wrapperRef, onLoadCallback)
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
                className={cn(
                    "rc-togglebutton",
                    props.borderPainted === false ? "border-notpainted" : '',
                    btnData.btnBorderPainted && tinycolor(btnBgd).isDark() ? "bright" : "dark",
                    props.borderOnMouseEntered ? "mouse-border" : '',
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
                offIcon={btnData.iconProps ? cn(btnData.iconProps.icon, 'rc-button-icon') : undefined}
                onIcon={btnData.iconProps ? cn(btnData.iconProps.icon, 'rc-button-icon') : undefined}
                iconPos={btnData.iconPos}
                tabIndex={btnData.tabIndex}
                checked={props.selected}
                onChange={handleOnChange}
            />
        </span>
    )
}
export default UIToggleButton