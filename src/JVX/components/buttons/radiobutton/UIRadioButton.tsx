import React, {FC, useContext, useLayoutEffect, useMemo, useRef} from "react";
import './UIRadioButton.scss'
import {RadioButton} from 'primereact/radiobutton';
import {jvxContext} from "../../../jvxProvider";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import {IButton} from "../IButton";
import {buttonProps, styleButton} from "../ButtonStyling";
import {createSetValueRequest} from "../../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import { swapProps } from "../../util/SwapProps";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import { parseJVxSize } from "../../util/parseJVxSize";

export interface IRadioButton extends IButton {
    selected?: boolean;
}

const UIRadioButton: FC<IRadioButton> = (baseProps) => {

    const buttonRef = useRef<HTMLSpanElement>(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IRadioButton>(baseProps.id, baseProps);
    const btnData = useMemo(() => buttonProps(props), [props]);
    const {onLoadCallback, id} = baseProps;

    useLayoutEffect(() => {
        const btnRef = buttonRef.current;
        if (btnRef) {
            if (props.horizontalTextPosition === 1) {
                swapProps(btnRef.children[0] as HTMLElement, 'justify-content', 'align-items')
            }
        }
    },[props.horizontalTextPosition]);

    useLayoutEffect(() => {
        const btnRef = buttonRef.current;
        if (btnRef) {
            styleButton(btnRef.children[0].children, props.className as string, props.horizontalTextPosition, props.verticalTextPosition, 
                props.imageTextGap, btnData.style, btnData.iconProps, context.server.RESOURCE_URL);
        }
    }, [btnData.btnBorderPainted,
        btnData.iconProps, btnData.style, context.server.RESOURCE_URL,
        props.className, props.horizontalTextPosition, props.imageTextGap,
        props.style, props.verticalTextPosition, id])

    useLayoutEffect(() => {
        const btnRef = buttonRef.current;
        if (btnRef) {
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), btnRef, onLoadCallback)
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    return (
        <span ref={buttonRef} style={layoutValue.get(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            <span className="jvxRadioButton" style={btnData.style}>
                <RadioButton 
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
                        <i className={btnData.iconProps.icon} style={{fontSize: btnData.iconProps.size.height, color: btnData.iconProps.color, marginRight: '4px'}}/>
                    }
                    {props.text}
                </label>
            </span>
        </span>
    )
}
export default UIRadioButton