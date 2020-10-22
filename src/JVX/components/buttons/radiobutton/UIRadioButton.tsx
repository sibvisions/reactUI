import React, {FC, useContext, useLayoutEffect, useRef} from "react";
import {RadioButton} from 'primereact/radiobutton';
import {jvxContext} from "../../../jvxProvider";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import {IButton} from "../IButton";
import {buttonProps, styleButton, styleChildren} from "../ButtonStyling";
import {createSetValueRequest} from "src/JVX/factories/RequestFactory";
import REQUEST_ENDPOINTS from "src/JVX/request/REQUEST_ENDPOINTS";

export interface IRadioButton extends IButton {
    selected?: boolean;
}

const UIRadioButton: FC<IRadioButton> = (baseProps) => {

    const buttonRef = useRef<HTMLSpanElement>(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IRadioButton>(baseProps.id, baseProps);
    const btnData = buttonProps(props);
    const {onLoadCallback, id} = baseProps;

    useLayoutEffect(() => {
        const btnRef = buttonRef.current;
        if (btnRef) {
            styleButton(btnRef.children[0] as HTMLElement, props);
            styleChildren(btnRef.children[0].children, props, btnData, layoutValue.get(props.id));
            if (onLoadCallback) {
                const size: DOMRect = btnRef.getBoundingClientRect();
                onLoadCallback(id, size.height, size.width);
            }
        }
    }, [onLoadCallback, id]);

    return (
        <span ref={buttonRef} style={layoutValue.get(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            <span style={btnData.style}>
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
                        <i className={btnData.iconProps.icon} style={{height:btnData.iconProps.size.height, width: btnData.iconProps.size.width, color: btnData.iconProps.color, marginRight: '4px'}}/>
                    }
                    {props.text}
                </label>
            </span>
        </span>
    )
}
export default UIRadioButton