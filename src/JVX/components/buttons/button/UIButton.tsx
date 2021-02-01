import React, {FC, useContext, useEffect, useLayoutEffect, useMemo, useRef} from "react";
import {Button} from "primereact/button";
import tinycolor from 'tinycolor2';
import {createPressButtonRequest} from "../../../factories/RequestFactory";
import {jvxContext} from "../../../jvxProvider";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import {IButton} from "../IButton";
import {addHoverEffect, buttonProps, centerElem, renderButtonIcon} from "../ButtonStyling";
import {sendOnLoadCallback} from "../../util/sendOnLoadCallback";
import {parseJVxSize} from "../../util/parseJVxSize";

const UIButton: FC<IButton> = (baseProps) => {

    const buttonRef = useRef<any>(null)
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IButton>(baseProps.id, baseProps);
    const btnData = useMemo(() => buttonProps(props), [props]);
    const {onLoadCallback, id} = baseProps;
    const btnDefaultBgd = window.getComputedStyle(document.documentElement).getPropertyValue('--btnDefaultBgd');
    const btnJustify = btnData.style.justifyContent || "center";
    const btnAlign = btnData.style.alignItems || "center";

    useLayoutEffect(() => {
        const wrapperRef = buttonWrapperRef.current;
        if (wrapperRef)
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), wrapperRef, onLoadCallback)

    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    useEffect(() => {
        if (buttonRef.current) {
            const btnRef = buttonRef.current.element;
            let bgdColor = btnData.style.background as string || btnDefaultBgd;
            if (btnData.iconProps.icon) {
                renderButtonIcon(btnRef.children[0] as HTMLElement, props, btnData.iconProps, context.server.RESOURCE_URL);
                if (props.horizontalTextPosition === 1)
                    centerElem(btnRef.children[0], btnRef.children[1], props.horizontalAlignment)
            }
            (btnData.btnBorderPainted && tinycolor(bgdColor).isDark()) ? btnRef.classList.add("bright") : btnRef.classList.add("dark");
            addHoverEffect(btnRef as HTMLElement, props.borderOnMouseEntered, bgdColor, null, 5, btnData.btnBorderPainted, undefined, props.background ? true : false);
        }
    }, [props, btnData.btnBorderPainted, btnData.iconProps, btnData.style, context.server.RESOURCE_URL, btnDefaultBgd]);

    const onButtonPress = () => {
        const req = createPressButtonRequest();
        req.componentId = props.name;
        context.server.sendRequest(req, REQUEST_ENDPOINTS.PRESS_BUTTON);
    }

    return(
        <span ref={buttonWrapperRef} style={layoutValue.has(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            <Button
                ref={buttonRef}
                className={"rc-button" + (props.borderPainted === false ? " border-notpainted" : "") + (props.style?.includes('hyperlink') ? " p-button-link" : "")}
                style={{...btnData.style, justifyContent: btnJustify, alignItems: btnAlign}}
                label={props.text}
                icon={btnData.iconProps ? btnData.iconProps.icon : undefined}
                iconPos={btnData.iconPos}
                tabIndex={btnData.tabIndex}
                onClick={onButtonPress}
                disabled={props.enabled === false}
            />
        </span>
    )
}
export default UIButton;