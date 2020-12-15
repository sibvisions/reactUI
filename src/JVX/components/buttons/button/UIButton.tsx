import React, {FC, useContext, useLayoutEffect, useMemo, useRef} from "react";
import {Button} from "primereact/button";
import {createPressButtonRequest} from "../../../factories/RequestFactory";
import {jvxContext} from "../../../jvxProvider";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import {IButton} from "../IButton";
import {addHoverEffect, buttonProps, styleButton} from "../ButtonStyling";
import {sendOnLoadCallback} from "../../util/sendOnLoadCallback";
import {parseJVxSize} from "../../util/parseJVxSize";

const UIButton: FC<IButton> = (baseProps) => {

    const buttonRef = useRef<HTMLSpanElement>(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IButton>(baseProps.id, baseProps);
    const btnData = useMemo(() => buttonProps(props), [props]);
    const {onLoadCallback, id} = baseProps;

    useLayoutEffect(() => {
        const btnRef = buttonRef.current;
        let bgdColor = btnData.style.backgroundColor;
        if (btnRef) {
            if (props.style?.includes('hyperlink'))
                btnRef.children[0].classList.add('hyperlink');
            styleButton(btnRef.children[0].children, props.className as string, props.horizontalTextPosition, props.verticalTextPosition, 
                props.imageTextGap, btnData.style, btnData.iconProps, context.server.RESOURCE_URL);
            if (!bgdColor)
                bgdColor = window.getComputedStyle(btnRef.children[0]).getPropertyValue('background-color');
            addHoverEffect(btnRef.children[0] as HTMLElement, props.className as string, props.borderOnMouseEntered, bgdColor, null, 5, btnData.btnBorderPainted, undefined, props.background ? true : false);
        }
    }, [btnData.btnBorderPainted, props.background,
        btnData.iconProps, btnData.style, context.server.RESOURCE_URL,
        props.className, props.horizontalTextPosition, props.imageTextGap,
        props.style, props.verticalTextPosition, id, props.borderOnMouseEntered])

    useLayoutEffect(() => {
        const btnRef = buttonRef.current;
        if (btnRef)
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), btnRef, onLoadCallback)

    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    const onButtonPress = () => {
        const req = createPressButtonRequest();
        req.componentId = props.name;
        context.server.sendRequest(req, REQUEST_ENDPOINTS.PRESS_BUTTON);
    }

    return(
        <span ref={buttonRef} style={layoutValue.has(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            <Button
                className={"jvxButton" + (props.borderPainted === false ? " borderNotPainted" : "")}
                style={btnData.style}
                label={props.text}
                icon={btnData.iconProps ? btnData.iconProps.icon : undefined}
                iconPos={btnData.iconPos}
                tabIndex={btnData.tabIndex as number}
                onClick={onButtonPress}
                disabled={props.enabled === false}
            />
        </span>
    )
}
export default UIButton;