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
import {addHoverEffect, buttonProps, centerElem, renderButtonIcon} from "../ButtonStyling";
import {sendOnLoadCallback} from "../../util/sendOnLoadCallback";
import {parseIconData} from "../../compprops/ComponentProperties";
import {parseJVxSize} from "../../util/parseJVxSize";

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
                elem.style.setProperty('background-image', 'url(' + context.server.RESOURCE_URL + pressedIconData.icon + ')');
        }

        const handleMouseImageReleased = (elem:HTMLElement) => {
            if (pressedIconData.icon?.includes('fa fa-')) {
                elem.classList.remove(pressedIconData.icon.substring(3));
                elem.classList.add((btnData.iconProps.icon as string).substring(3))
            }
            else
                elem.style.setProperty('background-image', 'url(' + context.server.RESOURCE_URL + btnData.iconProps.icon + ')');
        }

        const btnRef = buttonRef.current
        if (buttonRef.current) {
            const btnContainer = buttonRef.current.container;
            if (btnData.iconProps.icon) {
                const iconElement = btnContainer.children[0] as HTMLElement;
                renderButtonIcon(iconElement, props, btnData.iconProps, context.server.RESOURCE_URL);
                if (props.horizontalTextPosition === 1)
                    centerElem(btnContainer.children[0], btnContainer.children[1], props.horizontalAlignment)
                if (pressedIconData.icon) {
                    btnContainer.addEventListener('mousedown', () => handleMouseImagePressed(iconElement));
                    btnContainer.addEventListener('mouseup', () => handleMouseImageReleased(iconElement));
                    btnContainer.addEventListener('mouseout', () => handleMouseImageReleased(iconElement));
                }
            }
            (btnData.btnBorderPainted && tinycolor(btnBgd).isDark()) ? btnContainer.classList.add("bright") : btnContainer.classList.add("dark");
            addHoverEffect(btnContainer as HTMLElement, props.borderOnMouseEntered,
            btnBgd, tinycolor(btnBgd).darken(10).toString(), 5, btnData.btnBorderPainted, props.selected, props.background ? true : false);
        }
        return () => {
            if (btnRef && btnData.iconProps.icon && pressedIconData.icon) {
                const btnContainer = btnRef.container;
                const iconElement = btnContainer.children[0] as HTMLElement
                btnContainer.removeEventListener('mousedown', () => handleMouseImagePressed(iconElement));
                btnContainer.removeEventListener('mouseup', () => handleMouseImageReleased(iconElement));
                btnContainer.removeEventListener('mouseout', () => handleMouseImageReleased(iconElement));
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
                className={"rc-button"  + (props.borderPainted === false ? " border-notpainted" : "")}
                style={{...btnData.style, background: props.selected ? tinycolor(btnBgd).darken(10).toString() : btnBgd, justifyContent: btnHAlign, alignItems: btnVAlign}}
                offLabel={props.text}
                onLabel={props.text}
                offIcon={btnData.iconProps ? btnData.iconProps.icon : undefined}
                onIcon={btnData.iconProps ? btnData.iconProps.icon : undefined}
                iconPos={btnData.iconPos}
                tabIndex={btnData.tabIndex}
                checked={props.selected}
                onChange={handleOnChange}
            />
        </span>
    )
}
export default UIToggleButton