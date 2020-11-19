import React, {FC, useContext, useLayoutEffect, useMemo, useRef} from "react";
import './UIToggleButton.scss';
import tinycolor from 'tinycolor2';
import {ToggleButton} from 'primereact/togglebutton';
import {createPressButtonRequest} from "../../../factories/RequestFactory";
import {jvxContext} from "../../../jvxProvider";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import {IButton} from "../IButton";
import {addHoverEffect, buttonProps, styleButton} from "../ButtonStyling";
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

type ToggleButtonGradient = {
    upperGradient: string,
    lowerGradient: string
}

export interface IToggleButton extends IButton {
    mousePressedImage: string;
    selected: boolean
}

const UIToggleButton: FC<IToggleButton> = (baseProps) => {

    const buttonRef = useRef<HTMLSpanElement>(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IToggleButton>(baseProps.id, baseProps);
    const btnData = useMemo(() => buttonProps(props), [props]);
    const {onLoadCallback, id} = baseProps;
    const btnBgdHover = props.background ? tinycolor(props.background).darken(5).toString() : tinycolor("#dadada").darken(5).toString();
    const btnBgdChecked:ToggleButtonGradient = {upperGradient: props.background ? tinycolor(props.background).darken(25).toRgbString() : tinycolor("#dadada").darken(25).toRgbString(),
                                                lowerGradient: props.background ? tinycolor(props.background).darken(4).toRgbString() : tinycolor("#dadada").darken(4).toRgbString()};
    const bgdColor = useRef<any>();
    const onIconData = parseIconData(props.foreground, props.mousePressedImage)

    useLayoutEffect(() => {
        const btnRef = buttonRef.current;
        if (btnRef) {
            if (!bgdColor.current)
            bgdColor.current = btnData.style.backgroundColor ? btnData.style.backgroundColor : window.getComputedStyle(btnRef.children[0]).getPropertyValue('background-color');

            // if (!props.selected) {
            //     if (!props.background) {
            //         (btnRef.children[0] as HTMLElement).style.removeProperty("background-color");
            //         (btnRef.children[0] as HTMLElement).style.removeProperty("border-color");
            //     }
            //     else {
            //         (btnRef.children[0] as HTMLElement).style.setProperty("background-color", bgdColor.current);
            //         (btnRef.children[0] as HTMLElement).style.setProperty("border-color", bgdColor.current);
            //     }
            // }

            styleButton(btnRef.children[0].children, props.className, props.horizontalTextPosition, props.verticalTextPosition, 
                props.imageTextGap, btnData.style, btnData.iconProps, context.server.RESOURCE_URL);
            addHoverEffect(btnRef.children[0] as HTMLElement, props.className, props.borderOnMouseEntered, 
                bgdColor.current, btnBgdHover, 5, btnData.btnBorderPainted, props.selected, props.background ? true : false);
        }
    },[btnBgdHover, btnData.btnBorderPainted, 
        btnData.iconProps, btnData.style, props.selected, context.server.RESOURCE_URL,
        id, props.borderOnMouseEntered, props.className, props.background,
        props.horizontalTextPosition, props.imageTextGap, props.style, props.verticalTextPosition])

    useLayoutEffect(() => {
        const btnRef = buttonRef.current;
        if (btnRef) {
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), btnRef, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize])

    const handleOnChange = (event:ToggleButtonEvent) => {
        const req = createPressButtonRequest();
        req.componentId = props.name;
        context.server.sendRequest(req, REQUEST_ENDPOINTS.PRESS_BUTTON);
        //setChecked(event.value);
    }

    console.log(props.selected, id, btnData.style, btnBgdChecked)

    return (
        <span ref={buttonRef} style={layoutValue.has(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            <ToggleButton
                className={"jvxButton"  + (props.borderPainted === false ? " borderNotPainted" : "")}
                style={{...btnData.style, background: props.selected ? "linear-gradient(to bottom, " + btnBgdChecked.upperGradient + " 2%, " + btnBgdChecked.lowerGradient + "98%)" : bgdColor.current, borderColor: bgdColor.current}}
                offLabel={props.text}
                onLabel={props.text}
                offIcon={btnData.iconProps ? btnData.iconProps.icon : undefined}
                onIcon={btnData.iconProps ? onIconData.icon : undefined}
                iconPos={btnData.iconPos}
                tabIndex={btnData.tabIndex as number}
                checked={props.selected}
                onChange={event => handleOnChange(event)}
            />
        </span>
    )
}
export default UIToggleButton