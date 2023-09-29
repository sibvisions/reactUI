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

import React, { FC, useEffect, useLayoutEffect, useMemo, useState } from "react";
import IBaseComponent from "../../util/types/IBaseComponent";
import { Tooltip } from "primereact/tooltip";
import { isFAIcon } from "../../hooks/event-hooks/useButtonMouseImages";
import { parseIconData } from "../comp-props/ComponentProperties";
import useImageStyle from "../../hooks/style-hooks/useImageStyle";
import usePopupMenu from "../../hooks/data-hooks/usePopupMenu";
import { getAlignments } from "../comp-props/GetAlignments";
import Dimension from "../../util/types/Dimension";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../util/component-util/SizeUtil";
import { sendOnLoadCallback } from "../../util/server-util/SendOnLoadCallback";
import { concatClassnames } from "../../util/string-util/ConcatClassnames";
import { getTabIndex } from "../../util/component-util/GetTabIndex";
import { IExtendableIcon } from "../../extend-components/icon/ExtendIcon";
import { IComponentConstants } from "../BaseComponent";

interface IIcon extends IBaseComponent {
    preserveAspectRatio?: boolean
}

/**
 * This component displays either a FontAwesome icon or an image sent by the server
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIIcon: FC<IIcon & IExtendableIcon & IComponentConstants> = (props) => {
    /** Properties for icon */
    const iconProps = useMemo(() => parseIconData(props.foreground, props.image), [props.foreground, props.image]);

    /** Extracting onLoadCallback, id and alignments from baseProps */
    const {onLoadCallback, id, horizontalAlignment, verticalAlignment} = props;

    /**CSS properties for icon */
    const imageStyle = useImageStyle(horizontalAlignment, verticalAlignment, undefined, undefined, props.preserveAspectRatio);

    /** True, if the icon is loaded */
    const [iconIsLoaded, setIconIsLoaded] = useState<boolean>(false);

    /** The popup-menu of the ImageViewer */
    const popupMenu = usePopupMenu(props);

    /** The alignment of the component */
    const alignments = useMemo(() => getAlignments(props), [props.horizontalAlignment, props.verticalAlignment]);

    const [iconSize, setIconSize] = useState<Dimension|null>(null);
    
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

        setIconSize({ width: prefSize.width, height: prefSize.height });

        if (onLoadCallback) {
            sendOnLoadCallback(id, props.className, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback);
        }

        setIconIsLoaded(true);
    }

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout when the icon is a FontAwesome icon */
    useLayoutEffect(() => {
        if(onLoadCallback && props.forwardedRef.current) {
            if (props.image?.includes('FontAwesome') || !props.image) {
                let prefSize = parsePrefSize(props.preferredSize);
                if (!props.image && props.background) {
                    if (!props.preferredSize) {
                        prefSize = { height: 1, width: 1 }
                    }
                }
                sendOnLoadCallback(id, props.className, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), props.forwardedRef.current, onLoadCallback)
            }
        }
    },[onLoadCallback, id, props.image, props.preferredSize, props.maximumSize, props.minimumSize]);

    // If the lib user extends the Icon with onChange, call it when the image changes.
    useEffect(() => {
        if (props.onChange) {
            props.onChange(props.image)
        }
    }, [props.image]);

    /** 
    * Returns wether the icon is a FontAwesome icon or an image sent by the server 
    * @returns Iconelement based on if the icon is FontAwesome or server sent image
    */
    const iconOrImage = (icon:string|undefined) => {
        if (icon) {
            if(isFAIcon(icon))
                return (
                    <i 
                        id={props.name} 
                        {...popupMenu} 
                        className={icon} 
                        style={{ 
                            color: iconProps.color, 
                            fontSize: iconProps.size?.height 
                        }} 
                        data-pr-tooltip={props.toolTipText} 
                        data-pr-position="left" />
                )
            else {
                return (
                <img
                    id={props.name}
                    {...popupMenu}
                    alt="icon"
                    src={props.context.server.RESOURCE_URL + icon}
                    className={imageStyle && iconIsLoaded ? imageStyle : ""}
                    style={iconSize ? { width: (!imageStyle.includes("image-h-stretch") && imageStyle.includes("image-v-stretch")) ? iconSize.width : undefined, height: !imageStyle.includes("image-v-stretch") && imageStyle.includes("image-h-stretch") ? iconSize.height : undefined } : undefined}
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
            ref={props.forwardedRef} 
            id={props.name + "-_wrapper"}
            className={concatClassnames(
                "rc-icon", 
                props.focusable === false ? "no-focus-rect" : "",
                props.styleClassNames
            )}
            style={{...props.layoutStyle, ...props.compStyle, overflow: "hidden", justifyContent: alignments.ha, alignItems: alignments.va}}
            tabIndex={getTabIndex(props.focusable, props.tabIndex)}
        >
            <Tooltip target={"#" + props.name} />
            {iconOrImage(iconProps.icon)}
        </span>
    )
}
export default UIIcon