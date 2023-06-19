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

import React, { FC,  useLayoutEffect, useRef } from "react";
import { Button } from "primereact/button";
import tinycolor from 'tinycolor2';
import useButtonStyling from "../../../hooks/style-hooks/useButtonStyling";
import useButtonMouseImages from "../../../hooks/event-hooks/useButtonMouseImages";
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

export const RenderButtonHTML: FC<{ text:string }> = (props) => {
    return (
        <span className="button-html-label" dangerouslySetInnerHTML={{ __html: props.text as string }} />
    )
}

/**
 * This component displays a basic button
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIButton: FC<IButton & IExtendableButton> = (props) => {
    /** Reference for the button element */
    const buttonRef = useRef<any>(null);

    const inputRef = useRef<HTMLInputElement>(null);

    /** Style properties for the button */
    const btnStyle = useButtonStyling(props, props.layoutStyle, props.compStyle, buttonRef.current)

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = props;

    /** Hook to display mouseOverImages and mousePressedImage */
    useButtonMouseImages(btnStyle.iconProps, btnStyle.pressedIconProps, btnStyle.mouseOverIconProps, buttonRef.current ? buttonRef.current : undefined);

    /** Handles the requestFocus property */
    useRequestFocus(id, props.requestFocus, buttonRef.current, props.context);

    /** True if the text is HTML */
    const isHTML = useIsHTMLText(props.text);

    const popupMenu = usePopupMenu(props);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (buttonRef.current && props.forwardedRef.current) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), buttonRef.current, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, props.text, props.designerUpdate]);

    /** When the button is clicked, a pressButtonRequest is sent to the server with the buttons name as componentId */
    const onButtonPress = (event:any) => {
        if (props.onClick) {
            props.onClick(event)
        }

        if (inputRef.current && props.classNameEventSourceRef === "UploadButton") {
            inputRef.current.click();
        }

        if (props.eventAction) {
            const req = createDispatchActionRequest();
            req.componentId = props.name;
            req.isUploadButton = props.classNameEventSourceRef === "UploadButton" ? true : undefined
            showTopBar(props.context.server.sendRequest(req, REQUEST_KEYWORDS.PRESS_BUTTON), props.topbar);
        }
    }

    const getElementToRender = () => {
        const btnProps = {
            id: props.name,
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
                    '--iconTextGap': `${props.imageTextGap || 4}px`,
                    '--iconCenterGap': `${btnStyle.iconCenterGap}px`
                } : {})
            } as any,
            tabIndex: btnStyle.tabIndex,
            onClick: (event:any) => onButtonPress(event),
            onFocus: (event:any) => handleFocusGained(props.name, props.className, props.eventFocusGained, props.focusable, event, props.id, props.context),
            onBlur: () => {
                if (props.eventFocusLost) {
                    onFocusLost(props.name, props.context.server)
                }
            }
        }
        if (props.url) {
            return (
                <span className="hyperlink-wrapper">
                    <a
                        {...btnProps}
                        className={concatClassnames(
                            "rc-button",
                            "p-component",
                            "p-button",
                            !btnStyle.borderPainted ? "border-notpainted" : "",
                            props.style?.includes("hyperlink") ? "p-button-link" : "",
                            props.borderOnMouseEntered ? "mouse-border" : "",
                            `gap-${btnStyle.iconGapPos}`,
                            btnStyle.iconDirection,
                            btnStyle.iconDirection && btnStyle.style.alignItems === "center" ? "no-center-gap" : "",
                            props.focusable === false ? "no-focus-rect" : "",
                            isCompDisabled(props) ? "hyperlink-disabled" : "",
                            props.styleClassNames
                        )}
                        href={props.url}
                        target={props.target}
                        layoutstyle-wrapper={props.name + "-_wrapper"}
                        aria-label={props.ariaLabel}
                        {...popupMenu}>
                        {props.text}
                    </a>
                </span>

            )
        }
        else {
            return (
                <>
                    <Button
                        {...btnProps}
                        className={concatClassnames(
                            "rc-button",
                            !btnStyle.borderPainted ? "border-notpainted" : "",
                            props.style?.includes("hyperlink") ? "p-button-link" : "",
                            btnStyle.borderPainted && tinycolor(btnStyle.style.background?.toString()).isDark() ? "bright-button" : "dark-button",
                            props.borderOnMouseEntered ? "mouse-border" : "",
                            `gap-${btnStyle.iconGapPos}`,
                            btnStyle.iconDirection,
                            props.parent?.includes("TB") ? "rc-toolbar-button" : "",
                            btnStyle.iconDirection && btnStyle.style.alignItems === "center" ? "no-center-gap" : "",
                            props.focusable === false ? "no-focus-rect" : "",
                            props.styleClassNames
                        )}
                        label={!isHTML ? props.text : undefined}
                        aria-label={props.ariaLabel}
                        icon={btnStyle.iconProps ? concatClassnames(btnStyle.iconProps.icon, 'rc-button-icon') : undefined}
                        iconPos={btnStyle.iconPos}

                        disabled={isCompDisabled(props)}
                        tooltip={props.toolTipText}
                        tooltipOptions={{ position: "left" }}
                        layoutstyle-wrapper={props.name + "-_wrapper"}
                        {...popupMenu}>
                        {isHTML && props.text && <RenderButtonHTML text={props.text} />}
                    </Button>
                    {props.classNameEventSourceRef === "UploadButton" &&
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
        <span id={props.name + "-_wrapper"} ref={props.forwardedRef} style={props.layoutStyle}>
            {getElementToRender()}
        </span>
    )
}
export default UIButton;