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

import React, { FC,  useContext,  useEffect,  useLayoutEffect, useRef } from "react";
import { Button } from "primereact/button";
import tinycolor from 'tinycolor2';
import useComponentConstants from "../../../hooks/components-hooks/useComponentConstants";
import useButtonStyling from "../../../hooks/style-hooks/useButtonStyling";
import useButtonMouseImages from "../../../hooks/event-hooks/useButtonMouseImages";
import useMouseListener from "../../../hooks/event-hooks/useMouseListener";
import usePopupMenu from "../../../hooks/data-hooks/usePopupMenu";
import { createDispatchActionRequest } from "../../../factories/RequestFactory";
import { showTopBar } from "../../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../../../util/server-util/SendFocusRequests";
import { IButton } from "../IButton";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import REQUEST_KEYWORDS from "../../../request/REQUEST_KEYWORDS";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { isCompDisabled } from "../../../util/component-util/IsCompDisabled";
import { IExtendableButton } from "../../../extend-components/buttons/ExtendButton";
import useRequestFocus from "../../../hooks/event-hooks/useRequestFocus";
import useDesignerUpdates from "../../../hooks/style-hooks/useDesignerUpdates";
import useHandleDesignerUpdate from "../../../hooks/style-hooks/useHandleDesignerUpdate";
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
const UIButton: FC<IButton & IExtendableButton> = (baseProps) => {
    /** Reference for the button element */
    const buttonRef = useRef<any>(null);

    const inputRef = useRef<HTMLInputElement>(null);

    /** Reference for the span that is wrapping the button containing layout information */
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);

    /** Component constants for contexts, properties and style */
    const [context, topbar, [props], layoutStyle, compStyle, styleClassNames] = useComponentConstants<IButton & IExtendableButton>(baseProps);

    /** Style properties for the button */
    const btnStyle = useButtonStyling(props, layoutStyle, compStyle, buttonRef.current)

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = baseProps;

    /** Hook to display mouseOverImages and mousePressedImage */
    useButtonMouseImages(btnStyle.iconProps, btnStyle.pressedIconProps, btnStyle.mouseOverIconProps, buttonRef.current ? buttonRef.current : undefined);

    /** Handles the requestFocus property */
    useRequestFocus(id, props.requestFocus, buttonRef.current, context);

    /** Hook for MouseListener */
    useMouseListener(props.name, buttonWrapperRef.current ? buttonWrapperRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** True if the text is HTML */
    const isHTML = useIsHTMLText(props.text);

    /** Subscribes to designer-changes so the components are updated live */
    const designerUpdate = useDesignerUpdates(props.text ? "default-button" : "icon-only-button");

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (buttonRef.current && buttonWrapperRef.current) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), buttonRef.current, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, props.text, designerUpdate]);

    /** Retriggers the size-measuring and sets the layoutstyle to the component */
    useHandleDesignerUpdate(
        designerUpdate,
        buttonWrapperRef.current,
        layoutStyle,
        (clone: HTMLElement) => sendOnLoadCallback(
            id,
            props.className,
            parsePrefSize(props.preferredSize),
            parseMaxSize(props.maximumSize),
            parseMinSize(props.minimumSize),
            clone,
            onLoadCallback
        ),
        onLoadCallback
    );

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
            showTopBar(context.server.sendRequest(req, REQUEST_KEYWORDS.PRESS_BUTTON), topbar);
        }
    }

    return (
        <span id={props.name + "-_wrapper"} ref={buttonWrapperRef} style={layoutStyle}>
            <Button
                id={props.name}
                ref={buttonRef}
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
                    styleClassNames
                )}
                style={{
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
                        '--iconImage': `url(${context.server.RESOURCE_URL + btnStyle.iconProps.icon})`,
                        '--iconTextGap': `${props.imageTextGap || 4}px`,
                        '--iconCenterGap': `${btnStyle.iconCenterGap}px`
                    } : {})
                } as any}
                label={!isHTML ? props.text : undefined}
                aria-label={props.ariaLabel}
                icon={btnStyle.iconProps ? concatClassnames(btnStyle.iconProps.icon, 'rc-button-icon') : undefined}
                iconPos={btnStyle.iconPos}
                tabIndex={btnStyle.tabIndex}
                onClick={(event) => onButtonPress(event)}
                onFocus={(event) => {
                    if (props.eventFocusGained) {
                        onFocusGained(props.name, context.server);
                    }
                    else {
                        if (props.focusable === false) {
                            event.preventDefault();
                        }
                    }
                }}
                onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
                disabled={isCompDisabled(props)}
                tooltip={props.toolTipText}
                tooltipOptions={{ position: "left" }}
                layoutstyle-wrapper={props.name + "-_wrapper"}
                {...usePopupMenu(props)}>
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
                            context.server.sendRequest({ upload: true, formData: formData }, REQUEST_KEYWORDS.UPLOAD)
                        }
                    }}
                    upload-file-id="" />
            }
        </span>
    )
}
export default UIButton;