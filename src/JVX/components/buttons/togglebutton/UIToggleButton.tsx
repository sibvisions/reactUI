import React, {FC, useContext, useEffect, useLayoutEffect, useMemo, useRef} from "react";
import tinycolor from 'tinycolor2';
import {ToggleButton} from 'primereact/togglebutton';
import {createPressButtonRequest} from "../../../factories/RequestFactory";
import {jvxContext} from "../../../jvxProvider";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import {IButton} from "../IButton";
import {addHoverEffect, buttonProps, centerElem, renderButtonIcon} from "../ButtonStyling";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import { parseIconData } from "../../compprops/ComponentProperties";
import { parseJVxSize } from "../../util/parseJVxSize";

type ToggleButtonEvent = {
    originalEvent: Event,
    value: boolean,
    target: {
        type: string,
        name: string,
        id: string,
        value: boolean
    }
}

export interface IToggleButton extends IButton {
    mousePressedImage: string;
    selected: boolean
}

const UIToggleButton: FC<IToggleButton> = (baseProps) => {

    const buttonRef = useRef<any>(null)
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IToggleButton>(baseProps.id, baseProps);
    const btnData = useMemo(() => buttonProps(props), [props]);
    const {onLoadCallback, id} = baseProps;
    const btnDefaultBgd = window.getComputedStyle(document.documentElement).getPropertyValue('--btnDefaultBgd');
    const btnBgdHover = props.background ? tinycolor(props.background).darken(5).toString() : tinycolor(btnDefaultBgd).darken(5).toString();
    const btnBgdChecked = props.background ? tinycolor(props.background).darken(10).toString() : tinycolor(btnDefaultBgd).darken(10).toString();
    const onIconData = parseIconData(props.foreground, props.mousePressedImage)
    const btnJustify = btnData.style.justifyContent || "center";
    const btnAlign = btnData.style.alignItems || "center";

    useLayoutEffect(() => {
        const wrapperRef = buttonWrapperRef.current;
        if (wrapperRef) {
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), wrapperRef, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    useEffect(() => {
        const handleMouseImagePressed = (elem:HTMLElement) => {
            if (onIconData.icon?.includes('fa fa-')) {
                elem.classList.remove((btnData.iconProps.icon as string).substring(3));
                elem.classList.add(onIconData.icon.substring(3));
            }
            else
                elem.style.setProperty('background-image', 'url(' + context.server.RESOURCE_URL + onIconData.icon + ')');
        }

        const handleMouseImageReleased = (elem:HTMLElement) => {
            if (onIconData.icon?.includes('fa fa-')) {
                elem.classList.remove(onIconData.icon.substring(3));
                elem.classList.add((btnData.iconProps.icon as string).substring(3))
            }
            else
                elem.style.setProperty('background-image', 'url(' + context.server.RESOURCE_URL + btnData.iconProps.icon + ')');
        }

        const btnRef = buttonRef.current
        if (buttonRef.current) {
            const btnContainer = buttonRef.current.container;
            let bgdColor = btnData.style.background as string || btnDefaultBgd;
            if (btnData.iconProps.icon) {
                const iconElement = btnContainer.children[0] as HTMLElement;
                renderButtonIcon(iconElement, props, btnData.iconProps, context.server.RESOURCE_URL);
                if (props.horizontalTextPosition === 1)
                    centerElem(btnContainer.children[0], btnContainer.children[1], props.horizontalAlignment)
                if (onIconData.icon) {
                    btnContainer.addEventListener('mousedown', () => handleMouseImagePressed(iconElement));
                    btnContainer.addEventListener('mouseup', () => handleMouseImageReleased(iconElement));
                    btnContainer.addEventListener('mouseout', () => handleMouseImageReleased(iconElement));
                }
            }
            (btnData.btnBorderPainted && tinycolor(bgdColor).isDark()) ? btnContainer.classList.add("bright") : btnContainer.classList.add("dark");
            addHoverEffect(btnContainer as HTMLElement, props.borderOnMouseEntered,
            bgdColor, btnBgdChecked, 5, btnData.btnBorderPainted, props.selected, props.background ? true : false);
        }
        return () => {
            if (btnRef && btnData.iconProps.icon && onIconData.icon) {
                const btnContainer = btnRef.container;
                const iconElement = btnContainer.children[0] as HTMLElement
                btnContainer.removeEventListener('mousedown', () => handleMouseImagePressed(iconElement));
                btnContainer.removeEventListener('mouseup', () => handleMouseImageReleased(iconElement));
                btnContainer.removeEventListener('mouseout', () => handleMouseImageReleased(iconElement));
            }
        }
    },[props.selected, btnDefaultBgd, btnBgdHover, btnData.btnBorderPainted, btnData.iconProps, btnData.style, props, context.server.RESOURCE_URL, btnBgdChecked, onIconData.icon]);

    const handleOnChange = (event:ToggleButtonEvent) => {
        const req = createPressButtonRequest();
        req.componentId = props.name;
        context.server.sendRequest(req, REQUEST_ENDPOINTS.PRESS_BUTTON);
    }

    return (
        <span ref={buttonWrapperRef} style={layoutValue.has(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            <ToggleButton
                ref={buttonRef}
                className={"rc-button"  + (props.borderPainted === false ? " border-notpainted" : "")}
                style={{...btnData.style, background: props.selected ? btnBgdChecked : 
                        props.background ? props.background : btnDefaultBgd, justifyContent: btnJustify, alignItems: btnAlign}}
                offLabel={props.text}
                onLabel={props.text}
                offIcon={btnData.iconProps ? btnData.iconProps.icon : undefined}
                onIcon={btnData.iconProps ? btnData.iconProps.icon : undefined}
                iconPos={btnData.iconPos}
                tabIndex={btnData.tabIndex}
                checked={props.selected}
                onChange={event => handleOnChange(event)}
            />
        </span>
    )
}
export default UIToggleButton