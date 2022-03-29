import React, { FC, useLayoutEffect, useRef } from "react";
import { RadioButton } from 'primereact/radiobutton';
import tinycolor from 'tinycolor2';
import { useButtonStyling, useComponentConstants, useMouseListener } from "../../zhooks";
import { IButtonSelectable } from "..";
import { concatClassnames, sendOnLoadCallback, parsePrefSize, parseMinSize, parseMaxSize, checkComponentName, sendSetValue, isCompDisabled} from "../../util";
import { onFocusGained, onFocusLost } from "../../util/server-util/SendFocusRequests";

/**
 * This component displays a RadioButton and its label
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIRadioButton: FC<IButtonSelectable> = (baseProps) => {
    /** Reference for the RadioButton element */
    const rbRef = useRef<any>(null)

    /** Reference for label element of RadioButton */
    const labelRef = useRef<any>(null);

    /** Reference for the span that is wrapping the button containing layout information */
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);

    /** Component constants for contexts, properties and style */
    const [context, topbar, [props], layoutStyle, translation, compStyle] = useComponentConstants<IButtonSelectable>(baseProps);

    /** Style properties for the button */
    const btnStyle = useButtonStyling(props, layoutStyle, compStyle, labelRef.current, rbRef.current ? rbRef.current.element : undefined);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Hook for MouseListener */
    useMouseListener(props.name, buttonWrapperRef.current ? buttonWrapperRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = buttonWrapperRef.current;
        if (wrapperRef) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), wrapperRef, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, compStyle]);

    return (
        <span ref={buttonWrapperRef} style={layoutStyle}>
            <span
                id={checkComponentName(props.name)}
                aria-label={props.ariaLabel}
                className={concatClassnames(
                    "rc-radiobutton",
                    `gap-${btnStyle.iconGapPos}`,
                    btnStyle.iconDirection,
                    props.style?.includes("actiongroup") ? "radio-action-group" : "",
                    )}
                onFocus={props.eventFocusGained ? () => onFocusGained(props.name, context.server) : undefined}
                onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
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
                        '--iconImage': `url(${context.server.RESOURCE_URL + btnStyle.iconProps.icon})`,
                    } : {})
                } as any}>
                <RadioButton
                    ref={rbRef}
                    inputId={props.id}
                    style={{ order: btnStyle.iconPos === 'left' ? 1 : 2 }}
                    checked={props.selected}
                    onChange={() => sendSetValue(props.name, props.selected === undefined ? true : !props.selected, context.server, undefined, topbar)}
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
                    {props.text}
                </label>
            </span>
        </span>
    )
}
export default UIRadioButton