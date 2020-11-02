import React, {FC, useContext, useLayoutEffect, useMemo, useRef} from "react";
import {Checkbox} from 'primereact/checkbox';
import {jvxContext} from "../../jvxProvider";
import {LayoutContext} from "../../LayoutContext";
import useProperties from "../zhooks/useProperties";
import {IButton} from "../buttons/IButton";
import {buttonProps, styleButton, styleChildren} from "../buttons/ButtonStyling";
import {createSetValueRequest} from "src/JVX/factories/RequestFactory";
import REQUEST_ENDPOINTS from "src/JVX/request/REQUEST_ENDPOINTS";

export interface ICheckBox extends IButton {
    selected?: boolean;
}

const UICheckBox: FC<ICheckBox> = (baseProps) => {

    const buttonRef = useRef<HTMLSpanElement>(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<ICheckBox>(baseProps.id, baseProps);
    const btnData = useMemo(() => buttonProps(props), [props]);
    const {onLoadCallback, id} = baseProps;

    useLayoutEffect(() => {
        const btnRef = buttonRef.current;
        if (btnRef) {
            styleButton(btnRef.children[0] as HTMLElement, props.style);
            styleChildren(btnRef.children[0].children, props.className, props.horizontalTextPosition, props.verticalTextPosition, 
                props.imageTextGap, btnData.style, btnData.iconProps, btnData.btnAlignments, layoutValue.get(id)?.height as number | undefined, 
                layoutValue.get(id)?.width as number | undefined, context.server.RESOURCE_URL);
        }
    }, [btnData.btnAlignments, btnData.btnBorderPainted, 
        btnData.iconProps, btnData.style, context.server.RESOURCE_URL,
        props.className, props.horizontalTextPosition, props.imageTextGap,
        props.style, props.verticalTextPosition, id, layoutValue])

    useLayoutEffect(() => {
        const btnRef = buttonRef.current;
        if (btnRef) {
            if (onLoadCallback) {
                const size: DOMRect = btnRef.getBoundingClientRect();
                onLoadCallback(id, size.height, size.width);
            }
        }
    }, [onLoadCallback, id]);

    return (
        <span ref={buttonRef} style={layoutValue.get(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            <span style={btnData.style}>
                <Checkbox
                    inputId={props.id}
                    style={{order: btnData.iconPos === 'left' ? 1 : 2}}
                    checked={props.selected}
                    onChange={() => {
                        let checked = props.selected === undefined ? true : !props.selected;
                        const req = createSetValueRequest();
                        req.componentId = props.name;
                        req.value = checked;
                        context.server.sendRequest(req, REQUEST_ENDPOINTS.SET_VALUE);
                    }}
                />
                <label className="p-radiobutton-label" htmlFor={props.id} style={{order: btnData.iconPos === 'left' ? 2 : 1}}>
                    {btnData.iconProps.icon !== undefined &&
                        //@ts-ignore
                        <i className={btnData.iconProps.icon} style={{height:btnData.iconProps.size.height, width: btnData.iconProps.size.width, color: btnData.iconProps.color, marginRight: '4px'}}/>
                    }
                    {props.text}
                </label>
            </span>
        </span>
    )
}
export default UICheckBox