/** React imports */
import React, {FC, useContext, useLayoutEffect, useMemo, useRef} from "react";

/** 3rd Party imports */
import {Checkbox} from 'primereact/checkbox';
import tinycolor from 'tinycolor2';

/** Hook imports */
import useProperties from "../zhooks/useProperties";

/** Other imports */
import {jvxContext} from "../../jvxProvider";
import {LayoutContext} from "../../LayoutContext";
import {IButtonSelectable} from "../buttons/IButton";
import {buttonProps, renderRadioCheck} from "../buttons/ButtonStyling";
import {createSetValueRequest} from "../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../request/REQUEST_ENDPOINTS";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";
import { parseJVxSize } from "../util/parseJVxSize";

/**
 * This component displays a CheckBox and its label
 * @param baseProps - Initial properties sent by the server for this component
 */
const UICheckBox: FC<IButtonSelectable> = (baseProps) => {
    /** Reference for the CheckBox element */
    const cbRef = useRef<any>(null);
    /** Reference for label element of CheckBox */
    const labelRef = useRef<any>(null);
    /** Reference for the span that is wrapping the button containing layout information */
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IButtonSelectable>(baseProps.id, baseProps);
    /** Information on how to display the button, refreshes everytime the props change */
    const btnData = useMemo(() => buttonProps(props), [props]);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** Button Background either server set or default */
    const cbBgd = btnData.style.background as string || window.getComputedStyle(document.documentElement).getPropertyValue('--standardBgdColor');
    /** Server set or default horizontal alignment */
    const cbHAlign = btnData.style.justifyContent || (props.horizontalTextPosition !== 1 ? 'flex-start' : 'center');
    /** Server set or default vertical alignment */
    const cbVAlign = btnData.style.alignItems || (props.horizontalTextPosition !== 1 ? 'center' : 'flex-start');

    /** Apply all server sent styling for CheckBox */
    useLayoutEffect(() => {
        const lblRef = labelRef.current
        const checkRef = cbRef.current;
        if (checkRef && lblRef) {
            renderRadioCheck(checkRef.element, lblRef, props, btnData.iconProps, context.server.RESOURCE_URL);
            (btnData.btnBorderPainted && tinycolor(cbBgd).isDark()) ? lblRef.classList.add("bright") : lblRef.classList.add("dark");
        }
    }, [props, btnData.btnBorderPainted, btnData.iconProps, btnData.style, context.server.RESOURCE_URL, cbBgd]);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const btnRef = buttonWrapperRef.current;
        if (btnRef) {
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), btnRef, onLoadCallback)
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    return (
        <span ref={buttonWrapperRef} style={layoutValue.get(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            <span className="rc-checkbox" style={{...btnData.style, justifyContent: cbHAlign, alignItems: cbVAlign}}>
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
                        <i className={btnData.iconProps.icon}/>
                    }
                    {props.text}
                </label>
            </span>
        </span>
    )
}
export default UICheckBox