/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { FC, useEffect, useLayoutEffect, useRef } from "react";
import { RadioButton, RadioButtonChangeEvent } from 'primereact/radiobutton';
import tinycolor from 'tinycolor2';
import { handleFocusGained, onFocusLost } from "../../../util/server-util/FocusUtil";
import { IButtonSelectable } from "../IButton";
import useButtonStyling from "../../../hooks/style-hooks/useButtonStyling";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { sendSetValue } from "../../../util/server-util/SendSetValues";
import { isCompDisabled } from "../../../util/component-util/IsCompDisabled";
import { IExtendableSelectable } from "../../../extend-components/buttons/ExtendCheckbox";
import useRequestFocus from "../../../hooks/event-hooks/useRequestFocus";
import { RenderButtonHTML } from "../button/UIButton";
import useIsHTMLText from "../../../hooks/components-hooks/useIsHTMLText";

/**
 * This component displays a RadioButton and its label
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIRadioButton: FC<IButtonSelectable & IExtendableSelectable> = (props) => {
    /** Reference for the RadioButton element */
    const rbRef = useRef<any>(null)

    /** Reference for label element of RadioButton */
    const labelRef = useRef<any>(null);

    /** Style properties for the button */
    const btnStyle = useButtonStyling(props, props.layoutStyle, props.compStyle, labelRef.current, rbRef.current ? rbRef.current.element : undefined);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = props;

    /** Handles the requestFocus property */
    useRequestFocus(id, props.requestFocus, rbRef.current ? rbRef.current.inputRef ? rbRef.current.inputRef.current : undefined : undefined, props.context);

    /** True if the text is HTML */
    const isHTML = useIsHTMLText(props.text);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (props.forwardedRef.current) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), props.forwardedRef.current, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, props.compStyle, props.designerUpdate]);

    //If lib-user extends Radiobutton with onChange, call it when selected changes
    useEffect(() => {
        if (props.onChange) {
            props.onChange(props.selected === undefined ? true : !props.selected);
        }
    }, [props.selected])

    //If lib-user extends Radiobutton with onClick, call it when the Radiobutton is clicked
    const onClick = (event:RadioButtonChangeEvent) => {
        if (props.onClick) {
            props.onClick(event.originalEvent);
        }

        sendSetValue(props.name, props.selected === undefined ? true : !props.selected, props.context.server, props.topbar)
    }

    return (
        <span id={props.name} ref={props.forwardedRef} style={props.layoutStyle}>
            <span
                aria-label={props.ariaLabel}
                className={concatClassnames(
                    "rc-radiobutton",
                    `gap-${btnStyle.iconGapPos}`,
                    btnStyle.iconDirection,
                    props.styleClassNames
                    )}
                onFocus={(event) => handleFocusGained(props.name, props.className, props.eventFocusGained, props.focusable, event, props.name, props.context)}
                onBlur={props.eventFocusLost ? () => onFocusLost(props.name, props.context.server) : undefined}
                style={{
                    ...btnStyle.style,
                    '--radioJustify': btnStyle.style.justifyContent, 
                    '--radioAlign': btnStyle.style.alignItems,
                    '--radioPadding': btnStyle.style.padding,
                    '--background': btnStyle.style.background,
                    '--iconTextGap': `${props.imageTextGap || 4}px`,
                    '--iconCenterGap': `${btnStyle.iconCenterGap}px`,
                    ...(btnStyle.iconProps?.icon ? {
                        '--iconWidth': `${btnStyle.iconProps.size?.width}px`,
                        '--iconHeight': `${btnStyle.iconProps.size?.height}px`,
                        '--iconColor': btnStyle.iconProps.color,
                        '--iconImage': `url(${props.context.server.RESOURCE_URL + btnStyle.iconProps.icon})`,
                    } : {})
                } as any}>
                <RadioButton
                    ref={rbRef}
                    inputId={props.id}
                    style={{ order: btnStyle.iconPos === 'left' ? 1 : 2 }}
                    checked={props.selected}
                    onChange={onClick}
                    tooltip={props.toolTipText}
                    tooltipOptions={{ position: "left" }}
                    disabled={isCompDisabled(props)}
                    tabIndex={btnStyle.tabIndex}
                    className={props.focusable === false ? "no-focus-rect" : ""}
                />
                <label 
                    ref={labelRef} 
                    className={concatClassnames(
                        "p-radiobutton-label",
                        btnStyle.style.color ? 'textcolor-set' : '',
                        btnStyle.style.background !== "transparent" 
                        ? 
                            btnStyle.borderPainted && tinycolor(btnStyle.style.background?.toString()).isDark() 
                            ? 
                                "bright-button" 
                            : 
                                "dark-button"
                        :
                            "",
                        props.eventMousePressed ? "mouse-pressed-event" : ""
                        )} 
                    htmlFor={props.id} 
                    style={{ order: btnStyle.iconPos === 'left' ? 2 : 1, caretColor: "transparent" }}>
                    {btnStyle.iconProps.icon !== undefined &&
                        <i className={concatClassnames(btnStyle.iconProps.icon, 'rc-button-icon')}/>
                    }
                    {isHTML && props.text ? <RenderButtonHTML text={props.text} /> : props.text}
                </label>
            </span>
        </span>
    )
}
export default UIRadioButton