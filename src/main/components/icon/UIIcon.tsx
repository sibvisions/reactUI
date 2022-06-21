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

import React, { FC, useLayoutEffect, useMemo, useRef, useState } from "react";
import BaseComponent from "../../util/types/BaseComponent";
import { Tooltip } from "primereact/tooltip";
import { isFAIcon } from "../../hooks/event-hooks/useButtonMouseImages";
import useComponentConstants from "../../hooks/components-hooks/useComponentConstants";
import { parseIconData } from "../comp-props/ComponentProperties";
import useImageStyle from "../../hooks/style-hooks/useImageStyle";
import useMouseListener from "../../hooks/event-hooks/useMouseListener";
import usePopupMenu from "../../hooks/data-hooks/usePopupMenu";
import { getAlignments } from "../comp-props/GetAlignments";
import Dimension from "../../util/types/Dimension";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../util/component-util/SizeUtil";
import { sendOnLoadCallback } from "../../util/server-util/SendOnLoadCallback";
import { checkComponentName } from "../../util/component-util/CheckComponentName";
import { concatClassnames } from "../../util/string-util/ConcatClassnames";
import { getTabIndex } from "../../util/component-util/GetTabIndex";

/**
 * This component displays either a FontAwesome icon or an image sent by the server
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIIcon: FC<BaseComponent> = (baseProps) => {
    /** Reference for the span that is wrapping the icon containing layout information */
    const iconRef = useRef<HTMLSpanElement>(null);

    /** Component constants */
    const [context,, [props], layoutStyle,, compStyle] = useComponentConstants<BaseComponent>(baseProps);

    /** Properties for icon */
    const iconProps = parseIconData(props.foreground, props.image);

    /** Extracting onLoadCallback, id and alignments from baseProps */
    const {onLoadCallback, id, horizontalAlignment, verticalAlignment} = props;

    /**CSS properties for icon */
    const imageStyle = useImageStyle(horizontalAlignment, verticalAlignment, undefined, undefined);

    /** Hook for MouseListener */
    useMouseListener(props.name, iconRef.current ? iconRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** True, if the icon is loaded */
    const [iconIsLoaded, setIconIsLoaded] = useState<boolean>(false);

    /** The popup-menu of the ImageViewer */
    const popupMenu = usePopupMenu(props);

    /** The alignment of the component */
    const alignments = useMemo(() => getAlignments(props), [props.horizontalAlignment, props.verticalAlignment])
    
    /**
     * When the icon is loaded, measure the icon and then report its preferred-, minimum-, maximum and measured-size to the layout.
     * Only gets called when the icon is an image and not FontAwesome
     * @param event - icon load event
     */
    const iconLoaded = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const prefSize:Dimension = {width: 0, height: 0}
        if (props.preferredSize) {
            const parsedSize = parsePrefSize(props.preferredSize) as Dimension
            prefSize.height = parsedSize.height;
            prefSize.width = parsedSize.width;
        } 
        else {
            prefSize.height = event.currentTarget.height;
            prefSize.width = event.currentTarget.width;
        }
        if (onLoadCallback) {
            sendOnLoadCallback(id, props.className, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback);
        }

        setIconIsLoaded(true);
    }

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout when the icon is a FontAwesome icon */
    useLayoutEffect(() => {
        if(onLoadCallback && iconRef.current){
            if (props.image?.includes('FontAwesome') || !props.image) {
                sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), iconRef.current, onLoadCallback)
            }
        }
    },[onLoadCallback, id, props.image, props.preferredSize, props.maximumSize, props.minimumSize]);

    /** 
    * Returns wether the icon is a FontAwesome icon or an image sent by the server 
    * @returns Iconelement based on if the icon is FontAwesome or server sent image
    */
    const iconOrImage = (icon:string|undefined) => {
        if (icon) {
            if(isFAIcon(icon))
                return <i id={checkComponentName(props.name)} {...popupMenu} className={icon} style={{ color: iconProps.color, fontSize: iconProps.size?.height }} data-pr-tooltip={props.toolTipText} data-pr-position="left"/>
            else {
                return (
                <img
                    id={checkComponentName(props.name)}
                    {...popupMenu}
                    alt="icon"
                    src={context.server.RESOURCE_URL + icon}
                    className={imageStyle && iconIsLoaded ? imageStyle : ""}
                    onLoad={iconLoaded}
                    onError={iconLoaded}
                    data-pr-tooltip={props.toolTipText}
                    data-pr-position="left" />
                )
            } 
        }
        else {
            return (
                <div style={{background: props.background}} />
            )
        }
    }

    return (
        <span 
            ref={iconRef} 
            className={concatClassnames(
                "rc-icon", 
                props.focusable === false ? "no-focus-rect" : "",
                props.style
            )}
            style={{...layoutStyle, ...compStyle, overflow: "hidden", justifyContent: alignments.ha, alignItems: alignments.va}}
            tabIndex={getTabIndex(props.focusable, props.tabIndex)}
        >
            <Tooltip target={"#" + checkComponentName(props.name)} />
            {iconOrImage(iconProps.icon)}
        </span>
    )
}
export default UIIcon