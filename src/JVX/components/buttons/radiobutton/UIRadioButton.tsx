import React, {FC, useContext, useLayoutEffect, useMemo, useRef} from "react";
import {RadioButton} from 'primereact/radiobutton';
import tinycolor from 'tinycolor2';
import {jvxContext} from "../../../jvxProvider";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import {IButton} from "../IButton";
import {buttonProps, renderRadioCheck} from "../ButtonStyling";
import {createSetValueRequest} from "../../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import { parseJVxSize } from "../../util/parseJVxSize";

export interface IRadioButton extends IButton {
    selected?: boolean;
}

const UIRadioButton: FC<IRadioButton> = (baseProps) => {

    const rbRef = useRef<any>(null)
    const labelRef = useRef<any>(null);
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IRadioButton>(baseProps.id, baseProps);
    const btnData = useMemo(() => buttonProps(props), [props]);
    const {onLoadCallback, id} = baseProps;
    const rbJustify = btnData.style.justifyContent || 'flex-start';
    const rbAlign = btnData.style.alignItems || 'center';

    useLayoutEffect(() => {
        console.log(labelRef.current, rbRef.current)
        const lblRef = labelRef.current;
        const radioRef = rbRef.current
        if (lblRef && radioRef) {
            let bgdColor = btnData.style.background as string || window.getComputedStyle(document.documentElement).getPropertyValue('--standardBgdColor');
            renderRadioCheck(radioRef.element, lblRef.children[0] as HTMLElement, props, btnData.iconProps, context.server.RESOURCE_URL);
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
        <span ref={buttonWrapperRef} style={layoutValue.get(props.id) ? {...layoutValue.get(props.id), display: 'inline-flex', justifyContent: rbJustify, alignItems: rbAlign} : {position: "absolute"}}>
            <span className="rc-radiobutton" style={btnData.style}>
                <RadioButton
                    ref={rbRef}
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
                        <i className={btnData.iconProps.icon}/>
                    }
                    {props.text}
                </label>
            </span>
        </span>
    )
}
export default UIRadioButton