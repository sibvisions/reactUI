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

import React, { FC, useEffect, useRef } from "react";
import { handleFocusGained, onFocusLost } from "../../../util/server-util/FocusUtil";
import { Tooltip } from "primereact/tooltip";
import { IRCCellEditor } from "../CellEditorWrapper";
import { ICellEditor } from "../IEditor";
import useImageStyle from "../../../hooks/style-hooks/useImageStyle";
import usePopupMenu from "../../../hooks/data-hooks/usePopupMenu";
import Dimension from "../../../util/types/Dimension";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { getTabIndex } from "../../../util/component-util/GetTabIndex";
import { IExtendableImageEditor } from "../../../extend-components/editors/ExtendImageEditor";
import { removeLayoutStyle } from "../../../util/component-util/RemoveLayoutStyle";
import { IComponentConstants } from "../../BaseComponent";

/** Interface for cellEditor property of ImageViewer */
export interface ICellEditorImage extends ICellEditor {
    defaultImageName: string,
    preserveAspectRatio: boolean
}

/** Interface for ImageViewer */
export interface IEditorImage extends IRCCellEditor {
    cellEditor: ICellEditorImage
    placeholderVisible: boolean,
}

/**
 *  This component displays an image
 * @param props - Initial properties sent by the server for this component
 */
export const UIEditorImage: FC<IEditorImage & IExtendableImageEditor & IComponentConstants> = (props) => {
    /** Extracting onLoadCallback and id from props */
    const {onLoadCallback, id} = props

    /** Extracting alignments from props */
    const {verticalAlignment, horizontalAlignment} = props

    /**CSS properties for ImageViewer */
    const imageStyle = useImageStyle(horizontalAlignment, verticalAlignment, props.cellEditor_horizontalAlignment_, props.cellEditor_verticalAlignment_, props.cellEditor.preserveAspectRatio);

    /** The popup-menu of the ImageViewer */
    const popupMenu = usePopupMenu(props);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useEffect(() => {
        if (!props.cellEditor.defaultImageName || !props.selectedRow || (props.selectedRow && !props.selectedRow.data[props.columnName])) {
            removeLayoutStyle(props.forwardedRef.current);
            const prefSize:Dimension = props.forwardedRef.current ? { width: props.forwardedRef.current.offsetWidth, height: props.forwardedRef.current.offsetHeight } : { width: 0, height: 0 }
            if (props.preferredSize) {
                const parsedSize = parsePrefSize(props.preferredSize) as Dimension
                prefSize.height = parsedSize.height;
                prefSize.width = parsedSize.width;
            }
            if (onLoadCallback) {
                sendOnLoadCallback(id, props.cellEditor.className, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback)
            }
                
        }
    },[id, onLoadCallback, props.cellEditor.defaultImageName, props.preferredSize, props.maximumSize, props.minimumSize]);

    /**
     * When the image is loaded, measure the image and then report its preferred-, minimum-, maximum and measured-size to the layout
     * @param event - image load event
     */
    const imageLoaded = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        if ((event.target as HTMLElement).style.display === "none") {
            (event.target as HTMLElement).style.removeProperty("display");
        }
        const prefSize:Dimension = {width: 0, height: 0}
        if(props.preferredSize) {
            const parsedSize = parsePrefSize(props.preferredSize) as Dimension
            prefSize.height = parsedSize.height;
            prefSize.width = parsedSize.width;
        } 
        else {
            prefSize.height = event.currentTarget.height;
            prefSize.width = event.currentTarget.width;
        }

        if (onLoadCallback) {
            sendOnLoadCallback(id, props.cellEditor.className, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback);
        }   
    }

    // If the lib user extends the ImageCellEditor with onChange, call it when slectedRow changes.
    useEffect(() => {
        if (props.onChange) {
            props.onChange();
        }
    }, [props.selectedRow, props.onChange]);
    
    /** Returns the correct way to display the image, either base64 encoded or via resource url, if there is no valid data use the defaultImageName if there is one else return undefined */
    const getImageSource = () => {
        if (props.selectedRow && props.selectedRow.data[props.columnName] && !props.selectedRow.data[props.columnName].includes("FontAwesome")) {
            if (props.columnMetaData) {
                if (props.columnMetaData.dataTypeIdentifier === -2) {
                    return "data:image/jpeg;base64," + props.selectedRow.data[props.columnName];
                }
                else {
                    return props.context.server.RESOURCE_URL + props.selectedRow.data[props.columnName];
                }
            } 
        }
        else if (props.cellEditor.defaultImageName) {
            return props.context.server.RESOURCE_URL + props.cellEditor.defaultImageName;
        }
        return undefined
    }

    return (
        <span
            ref={props.forwardedRef}
            id={!props.isCellEditor ? props.name : undefined}
            className={concatClassnames(
                "rc-editor-image",
                props.columnMetaData?.nullable === false ? "required-field" : "",
                props.focusable === false ? "no-focus-rect" : "",
            )}
            style={{ ...props.layoutStyle, ...props.cellStyle, overflow: "hidden", caretColor: "transparent" }}
            aria-label={props.ariaLabel}
            onFocus={(event) => handleFocusGained(props.name, props.cellEditor.className, props.eventFocusGained, props.focusable, event, props.name, props.context, props.isCellEditor)}
            onBlur={props.eventFocusLost ? () => onFocusLost(props.name, props.context.server) : undefined}
            tabIndex={props.isCellEditor ? -1 : getTabIndex(props.focusable, props.tabIndex)}
        >
            <Tooltip target={!props.isCellEditor ? "#" + props.name : undefined} />
            {((props.selectedRow && props.selectedRow.data[props.columnName]) || props.cellEditor.defaultImageName) &&
                <img
                    className={concatClassnames(imageStyle, props.styleClassNames)}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    //style={imageStyle.img}
                    src={getImageSource()}
                    alt="could not be loaded"
                    onLoad={imageLoaded}
                    onError={e => (e.target as HTMLImageElement).style.display = 'none'}
                    data-pr-tooltip={props.toolTipText}
                    data-pr-position="left"
                    onClick={(e) => {
                        if (props.onClick) {
                            props.onClick(e)
                        }
                    }}
                {...popupMenu}
                />}
        </span>

    )
}
//export default UIEditorImage