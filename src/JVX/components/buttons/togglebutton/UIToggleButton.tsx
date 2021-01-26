import React, {FC, useContext, useLayoutEffect, useMemo, useRef, /*useState*/} from "react";
import tinycolor from 'tinycolor2';
import {ToggleButton} from 'primereact/togglebutton';
import {createPressButtonRequest} from "../../../factories/RequestFactory";
import {jvxContext} from "../../../jvxProvider";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import {IButton} from "../IButton";
import {addHoverEffect, buttonProps, renderButtonIcon} from "../ButtonStyling";
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

export interface ToggleButtonGradient {
    upperGradient: string,
    lowerGradient: string
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
    const btnBgdHover = props.background ? tinycolor(props.background).darken(5).toString() : tinycolor("#dadada").darken(5).toString();
    const btnBgdChecked:ToggleButtonGradient = {upperGradient: props.background ? tinycolor(props.background).darken(25).toRgbString() : tinycolor("#dadada").darken(25).toRgbString(),
                                                lowerGradient: props.background ? tinycolor(props.background).darken(4).toRgbString() : tinycolor("#dadada").darken(4).toRgbString()};
    const onIconData = parseIconData(props.foreground, props.mousePressedImage)
    //const [checked, setChecked] = useState(props.selected);

    useLayoutEffect(() => {
        if (buttonRef.current) {
            const btnRef = buttonRef.current.container;
            let bgdColor = btnData.style.background as string || window.getComputedStyle(document.documentElement).getPropertyValue('--tglBtnDefaultBgd');
            if (btnData.iconProps.icon)
                renderButtonIcon(btnRef.children[0] as HTMLElement, props, btnData.iconProps, context.server.RESOURCE_URL);
            (btnData.btnBorderPainted && tinycolor(bgdColor).isDark()) ? btnRef.classList.add("bright") : btnRef.classList.add("dark");
            addHoverEffect(btnRef as HTMLElement, props.borderOnMouseEntered,
            bgdColor, btnBgdChecked, 5, btnData.btnBorderPainted, props.selected, props.background ? true : false);
        }

    },[btnBgdHover, btnData.btnBorderPainted, btnData.iconProps, 
        btnData.style, props, context.server.RESOURCE_URL, btnBgdChecked])

    useLayoutEffect(() => {
        const btnRef = buttonWrapperRef.current;
        if (btnRef) {
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), btnRef, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize])

    const handleOnChange = (event:ToggleButtonEvent) => {
        const req = createPressButtonRequest();
        req.componentId = props.name;
        context.server.sendRequest(req, REQUEST_ENDPOINTS.PRESS_BUTTON);
        //setChecked(event.value);
    }

    return (
        <span ref={buttonWrapperRef} style={layoutValue.has(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            <ToggleButton
                ref={buttonRef}
                className={"rc-button"  + (props.borderPainted === false ? " border-notpainted" : "")}
                style={{...btnData.style, background: props.selected ? "linear-gradient(to bottom, " + btnBgdChecked.upperGradient + " 2%, " + btnBgdChecked.lowerGradient + "98%)" : props.background ? props.background : undefined}}
                offLabel={props.text}
                onLabel={props.text}
                offIcon={btnData.iconProps ? btnData.iconProps.icon : undefined}
                onIcon={onIconData.icon ? onIconData.icon : btnData.iconProps.icon}
                iconPos={btnData.iconPos}
                tabIndex={btnData.tabIndex}
                checked={props.selected}
                onChange={event => handleOnChange(event)}
            />
        </span>
    )
}
export default UIToggleButton