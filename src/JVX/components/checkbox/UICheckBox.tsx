import React, {FC, useContext, useLayoutEffect, useMemo, useRef} from "react";
import {Checkbox} from 'primereact/checkbox';
import tinycolor from 'tinycolor2';
import {jvxContext} from "../../jvxProvider";
import {LayoutContext} from "../../LayoutContext";
import useProperties from "../zhooks/useProperties";
import {IButton} from "../buttons/IButton";
import {buttonProps, renderRadioCheck} from "../buttons/ButtonStyling";
import {createSetValueRequest} from "../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../request/REQUEST_ENDPOINTS";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";
import { parseJVxSize } from "../util/parseJVxSize";

export interface ICheckBox extends IButton {
    selected?: boolean;
}

const UICheckBox: FC<ICheckBox> = (baseProps) => {

    const cbRef = useRef<any>(null);
    const labelRef = useRef<any>(null);
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<ICheckBox>(baseProps.id, baseProps);
    const btnData = useMemo(() => buttonProps(props), [props]);
    const {onLoadCallback, id} = baseProps;
    const cbJustify = btnData.style.justifyContent || (props.horizontalTextPosition !== 1 ? 'flex-start' : 'center');;
    const cbAlign = btnData.style.alignItems || (props.horizontalTextPosition !== 1 ? 'center' : 'flex-start');

    useLayoutEffect(() => {
        const lblRef = labelRef.current
        const checkRef = cbRef.current;
        if (checkRef && lblRef) {
            let bgdColor = btnData.style.background as string || window.getComputedStyle(document.documentElement).getPropertyValue('--standardBgdColor');
            renderRadioCheck(checkRef.element, lblRef, props, btnData.iconProps, context.server.RESOURCE_URL);
            (btnData.btnBorderPainted && tinycolor(bgdColor).isDark()) ? lblRef.classList.add("bright") : lblRef.classList.add("dark");
        }
    }, [props, btnData.btnBorderPainted, btnData.iconProps, btnData.style, context.server.RESOURCE_URL])

    useLayoutEffect(() => {
        const btnRef = buttonWrapperRef.current;
        if (btnRef) {
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), btnRef, onLoadCallback)
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    return (
        <span ref={buttonWrapperRef} style={layoutValue.get(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            <span className="rc-checkbox" style={{...btnData.style, justifyContent: cbJustify, alignItems: cbAlign}}>
                <Checkbox
                    ref={cbRef}
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
                <label ref={labelRef} className="p-radiobutton-label" htmlFor={props.id} style={{order: btnData.iconPos === 'left' ? 2 : 1}}>
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