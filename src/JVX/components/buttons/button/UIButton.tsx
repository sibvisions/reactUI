import React, {FC, useContext, useLayoutEffect, useMemo, useRef} from "react";
import './UIButton.scss';
import {Button} from "primereact/button";
import {createPressButtonRequest} from "../../../factories/RequestFactory";
import {jvxContext} from "../../../jvxProvider";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import {IButton} from "../IButton";
import {addHoverEffect, buttonProps, styleButton, styleChildren} from "../ButtonStyling";

const UIButton: FC<IButton> = (baseProps) => {

    const buttonRef = useRef<HTMLSpanElement>(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IButton>(baseProps.id, baseProps);
    const btnData = useMemo(() => buttonProps(props), [props]);
    const {onLoadCallback, id} = baseProps;

    useLayoutEffect(() => {
        const btnRef = buttonRef.current;
        if (btnRef) {
            styleButton(btnRef.children[0] as HTMLElement, props.style);
            styleChildren(btnRef.children[0].children, props.className, props.horizontalTextPosition, props.verticalTextPosition, 
                props.imageTextGap, btnData.style, btnData.iconProps, btnData.btnAlignments, layoutValue.get(id)?.height as number | undefined, 
                layoutValue.get(id)?.width as number | undefined, context.server.RESOURCE_URL);
            addHoverEffect(btnRef.children[0] as HTMLElement, props.className, props.borderOnMouseEntered, btnData.style.backgroundColor, null, 5, btnData.btnBorderPainted, undefined);
        }
    }, [btnData.btnAlignments, btnData.btnBorderPainted, 
        btnData.iconProps, btnData.style, context.server.RESOURCE_URL,
        props.className, props.horizontalTextPosition, props.imageTextGap,
        props.style, props.verticalTextPosition, id, layoutValue, props.borderOnMouseEntered])

    useLayoutEffect(() => {
        const btnRef = buttonRef.current;
        if (btnRef) {
            if (onLoadCallback) {
                const size: DOMRect = btnRef.getBoundingClientRect();
                onLoadCallback(id, size.height, size.width);
            }
        }
    }, [onLoadCallback, id]);

    const onButtonPress = () => {
        const req = createPressButtonRequest();
        req.componentId = props.name;
        context.server.sendRequest(req, REQUEST_ENDPOINTS.PRESS_BUTTON);
    }

    return(
        <span ref={buttonRef} style={layoutValue.has(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            <Button
                style={btnData.style}
                label={props.text}
                icon={btnData.iconProps ? btnData.iconProps.icon : undefined}
                iconPos={btnData.iconPos}
                tabIndex={btnData.tabIndex as number}
                onClick={onButtonPress}
            />
        </span>
        
    )
}
export default UIButton;