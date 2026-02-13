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

import React, { CSSProperties, FC,  useLayoutEffect, useRef } from "react";
import { Button } from "primereact/button";
import tinycolor from 'tinycolor2';
import useButtonStyling, { BUTTON_CELLEDITOR_STYLES } from "../../../hooks/style-hooks/useButtonStyling";
import useButtonMouseImages, { isFAIcon } from "../../../hooks/event-hooks/useButtonMouseImages";
import usePopupMenu from "../../../hooks/data-hooks/usePopupMenu";
import { createDispatchActionRequest } from "../../../factories/RequestFactory";
import { showTopBar } from "../../topbar/TopBar";
import { handleFocusGained, onFocusLost } from "../../../util/server-util/FocusUtil";
import { IButton } from "../IButton";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import REQUEST_KEYWORDS from "../../../request/REQUEST_KEYWORDS";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { isCompDisabled } from "../../../util/component-util/IsCompDisabled";
import { IExtendableButton } from "../../../extend-components/buttons/ExtendButton";
import useRequestFocus from "../../../hooks/event-hooks/useRequestFocus";
import useIsHTMLText from "../../../hooks/components-hooks/useIsHTMLText";
import IBaseComponent from "../../../util/types/IBaseComponent";
import { IComponentConstants } from "../../BaseComponent";
import { IEditorCheckBox, handleCheckboxOnChange } from "../../editors/checkbox/UIEditorCheckbox";
import CELLEDITOR_CLASSNAMES from "../../editors/CELLEDITOR_CLASSNAMES";

// If the Buttons text contains HTML, render it in a span, because the button on its own isn't able to render HTML.
export const RenderButtonHTML: FC<{ text:string }> = (props) => {
    return (
        <span className="button-html-label" dangerouslySetInnerHTML={{ __html: props.text as string }} />
    )
}

/** Checks if the contentstore is for transfermode full */
export function isCheckboxCellEditor(props: IBaseComponent & IComponentConstants | IEditorCheckBox & IComponentConstants): props is IEditorCheckBox & IComponentConstants {
    if ((props as IEditorCheckBox & IComponentConstants).cellEditor) {
        return (props as IEditorCheckBox & IComponentConstants).cellEditor?.className === CELLEDITOR_CLASSNAMES.CHECKBOX
    }
    return false;
}

export function getButtonText(props: IBaseComponent & IComponentConstants | IEditorCheckBox & IComponentConstants) {
    if (!isCheckboxCellEditor(props)) {
        return props.text;
    }
    else {
        if ((props.cellEditor.style?.includes(BUTTON_CELLEDITOR_STYLES.BUTTON) || props.cellEditor.style?.includes(BUTTON_CELLEDITOR_STYLES.HYPERLINK)) && props.cellEditor.selectedValue === null && props.cellEditor.deselectedValue === null) {
            return props.selectedRow ? props.selectedRow.data[props.columnName] : "";
        }
        else if (props.cellEditor.text === null && props.columnMetaData) {
            return props.columnMetaData.label;
        }
        else {
            return props.cellEditor.text;
        }
    }
}

/**
 * This component displays a basic button
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIButton: FC<IButton & IExtendableButton | IEditorCheckBox & IComponentConstants> = (props) => {
    /** Reference for the button component */
    const buttonRef = useRef<any>(null);

    /** Reference for the input element, if the button is an upload button */
    const inputRef = useRef<HTMLInputElement>(null);

    /** Style properties for the button */
    const btnStyle = useButtonStyling(props, props.layoutStyle, props.compStyle, buttonRef.current);

    /** Hook to display mouseOverImages and mousePressedImage */
    useButtonMouseImages(btnStyle.iconProps, btnStyle.pressedIconProps, btnStyle.mouseOverIconProps, buttonRef.current ? buttonRef.current : undefined);

    /** Handles the requestFocus property */
    useRequestFocus(props.id, props.requestFocus, buttonRef.current, props.context);

    /** Potential popup menu of a button */
    const popupMenu = usePopupMenu(props);

    /** True if the text is HTML */
    const isHTML = useIsHTMLText(getButtonText(props));

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = props;
    
    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (props.forwardedRef.current) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), props.forwardedRef.current, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, props.text, props.designerUpdate, props.forwardedRef.current]);

    /** When the button is clicked, a pressButtonRequest is sent to the server with the buttons name as componentId */
    const onButtonPress = (event:any) => {
        if (!isCheckboxCellEditor(props)) {
            // ReactUI as lib, execute given event
            if (props.onClick) {
                props.onClick(event)
            }

            if (props.eventAction) {
                const req = createDispatchActionRequest();
                req.componentId = props.name;
                req.isUploadButton = props.classNameEventSourceRef === "UploadButton" ? true : undefined
                showTopBar(props.context.server.sendRequest(req, REQUEST_KEYWORDS.PRESS_BUTTON), props.topbar);
            }
        }
        else {
            handleCheckboxOnChange(
                props.name,
                props.dataRow,
                props.columnName,
                false,
                props.cellEditor.style?.includes(BUTTON_CELLEDITOR_STYLES.HYPERLINK) ? props.selectedRow ? props.selectedRow.data[props.columnName] : null : props.cellEditor.selectedValue,
                props.cellEditor.deselectedValue,
                props.context.server,
                props.rowIndex,
                props.selectedRow.index,
                props.filter,
                props.isCellEditor
            )
        }

    }

    /** Returns the correct Button element to render, hyperlink, "normal" button, uploadbutton */
    const getElementToRender = () => {
        const btnProps = {
            ref: buttonRef,
            style: {
                ...btnStyle.style,
                background: undefined,
                borderColor: undefined,
                '--btnJustify': btnStyle.style.justifyContent,
                '--btnAlign': btnStyle.style.alignItems,
                '--btnPadding': btnStyle.style.padding ? btnStyle.style.padding : undefined,
                '--background': btnStyle.style.background,
                '--hoverBackground': tinycolor(btnStyle.style.background?.toString()).darken(5).toString(),
                ...(btnStyle.iconProps?.icon ? {
                    '--iconWidth': `${btnStyle.iconProps.size?.width}px`,
                    '--iconHeight': `${btnStyle.iconProps.size?.height}px`,
                    '--iconColor': btnStyle.iconProps.color,
                    '--iconImage': `url(${props.context.server.RESOURCE_URL + btnStyle.iconProps.icon})`,
                    '--iconTextGap': `${!isCheckboxCellEditor(props) ? (props as IButton).imageTextGap || 4 : 4}px`,
                    '--iconCenterGap': `${btnStyle.iconCenterGap}px`
                } : {})
            } as CSSProperties,
            className: concatClassnames(
                "rc-button",
                props.style?.includes("hyperlink") || (isCheckboxCellEditor(props) && props.cellEditor.style?.includes(BUTTON_CELLEDITOR_STYLES.HYPERLINK)) ? concatClassnames("p-component", "p-button", "p-button-link", isCompDisabled(props) ? "hyperlink-disabled" : "") : "",
                !btnStyle.borderPainted ? "border-notpainted" : "",
                btnStyle.borderPainted && tinycolor(btnStyle.style.background?.toString()).isDark() ? "bright-button" : "dark-button",
                !isCheckboxCellEditor(props) ? (props as IButton).borderOnMouseEntered ? "mouse-border" : "" : "",
                `gap-${btnStyle.iconGapPos}`,
                btnStyle.iconDirection,
                props.parent?.includes("TB") ? "rc-toolbar-button" : "",
                btnStyle.iconDirection && btnStyle.style.alignItems === "center" ? "no-center-gap" : "",
                props.focusable === false ? "no-focus-rect" : "",
                (isCheckboxCellEditor(props) && props.cellEditor.style?.includes(BUTTON_CELLEDITOR_STYLES.HYPERLINK)) && !props.style?.includes("hyperlink") ? "hyperlink" : "", 
                props.styleClassNames
            ),
            onFocus: (event:any) => handleFocusGained(props.name, props.className, props.eventFocusGained, props.focusable, event, props.id, props.context),
            onBlur: () => {
                if (props.eventFocusLost) {
                    onFocusLost(props.name, props.context.server)
                }
            },
            tabIndex: btnStyle.tabIndex,
        }

        // If there is an url in props, render a hyperlink button
        if ((!isCheckboxCellEditor(props) && props.url) || (isCheckboxCellEditor(props) && props.cellEditor.style?.includes(BUTTON_CELLEDITOR_STYLES.HYPERLINK))) {
            return (
                <Button
                    link
                    onClick={(event: any) => { 
                        onButtonPress(event);
                        window.open(!isCheckboxCellEditor(props) ? props.url : undefined, !isCheckboxCellEditor(props) ? props.target : undefined) }
                    }
                    {...btnProps}
                    label={!isHTML ? getButtonText(props) : undefined}
                    icon={btnStyle.iconProps ? isFAIcon(btnStyle.iconProps.icon) ? concatClassnames(btnStyle.iconProps.icon, 'rc-button-icon') : 'rc-button-icon' : undefined}
                    iconPos={btnStyle.iconPos}
                    disabled={!isCheckboxCellEditor(props) ? isCompDisabled(props) : props.isReadOnly}
                    tooltip={props.toolTipText}
                    tooltipOptions={{ position: "left", showDelay: 800 }}
                    layoutstyle-wrapper={props.name}
                    {...popupMenu}>
                    {isHTML && <RenderButtonHTML text={getButtonText(props) || ""} />}
                </Button>
            )
        }
        else {
            return (
                <>
                    <Button
                        {...btnProps}
                        onClick = {(event:any) => onButtonPress(event)}
                        label={!isHTML ? getButtonText(props) : undefined}
                        icon={btnStyle.iconProps ? isFAIcon(btnStyle.iconProps.icon) ? concatClassnames(btnStyle.iconProps.icon, 'rc-button-icon') : 'rc-button-icon' : undefined}
                        iconPos={btnStyle.iconPos}
                        disabled={!isCheckboxCellEditor(props) ? isCompDisabled(props) : props.isReadOnly}
                        tooltip={props.toolTipText}
                        tooltipOptions={{ position: "left", showDelay: 800 }}
                        layoutstyle-wrapper={props.name}
                        {...popupMenu}>
                        {isHTML && <RenderButtonHTML text={getButtonText(props) || ""} />}
                    </Button>
                    {props.classNameEventSourceRef === "UploadButton" &&
                        // render an additional invisible input element to open the file dialog and upload files
                        <input
                            id={props.name + "-upload"}
                            type="file"
                            ref={inputRef}
                            style={{ visibility: "hidden", height: "0px", width: "0px" }}
                            onChange={(e) => {
                                if (inputRef.current) {
                                    const formData = new FormData();
                                    formData.set("clientId", sessionStorage.getItem("clientId") || "")
                                    formData.set("fileId", inputRef.current.getAttribute("upload-file-id") as string)
                                    // @ts-ignore
                                    formData.set("data", e.target.files[0])
                                    props.context.server.sendRequest({ upload: true, formData: formData }, REQUEST_KEYWORDS.UPLOAD)
                                }
                            }}
                            upload-file-id="" />
                    }
                </>
            )
        }
    }
    
    return (
        <span id={props.name} 
              ref={props.forwardedRef} 
              style={!props.id ? undefined : props.layoutStyle}
              aria-label={props.ariaLabel}>
            {getElementToRender()}
        </span> 
    )
}
export default UIButton;