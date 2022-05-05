import React, { FC, useEffect, useRef } from "react";
import { useImageStyle, useMouseListener, usePopupMenu } from "../../../hooks";
import { ICellEditor } from "..";
import { parsePrefSize, parseMinSize, parseMaxSize, Dimension, sendOnLoadCallback, concatClassnames, checkComponentName, getTabIndex } from "../../../util";
import { onFocusGained, onFocusLost } from "../../../util/server-util/SendFocusRequests";
import { Tooltip } from "primereact/tooltip";
import { IRCCellEditor } from "../CellEditorWrapper";

/** Interface for cellEditor property of ImageViewer */
export interface ICellEditorImage extends ICellEditor{
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
const UIEditorImage: FC<IEditorImage> = (props) => {
    /** Reference for wrapper span */
    const wrapRef = useRef<HTMLSpanElement>(null);

    /** Extracting onLoadCallback and id from props */
    const {onLoadCallback, id} = props

    /** Extracting alignments from props */
    const {verticalAlignment, horizontalAlignment} = props

    /**CSS properties for ImageViewer */
    const imageStyle = useImageStyle(horizontalAlignment, verticalAlignment, props.cellEditor_horizontalAlignment_, props.cellEditor_verticalAlignment_, props.cellEditor.preserveAspectRatio);

    /** Hook for MouseListener */
    useMouseListener(props.name, wrapRef.current ? wrapRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The popup-menu of the ImageViewer */
    const popupMenu = usePopupMenu(props);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useEffect(() => {
        if (!props.cellEditor.defaultImageName || !props.selectedRow) {
            const prefSize:Dimension = {width: 0, height: 0}
            if (props.preferredSize) {
                const parsedSize = parsePrefSize(props.preferredSize) as Dimension
                prefSize.height = parsedSize.height;
                prefSize.width = parsedSize.width;
            }
            if (onLoadCallback)
                sendOnLoadCallback(id, props.cellEditor.className, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback)
        }
    },[onLoadCallback, id, props.cellEditor.defaultImageName, props.preferredSize, props.maximumSize, props.minimumSize]);

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

    return (
        <span
            ref={wrapRef}
            className={concatClassnames(
                "rc-editor-image",
                props.columnMetaData?.nullable === false ? "required-field" : "",
                props.focusable === false ? "no-focus-rect" : "",
            )}
            style={{ ...props.layoutStyle, ...props.cellStyle, overflow: "hidden", caretColor: "transparent" }}
            aria-label={props.ariaLabel}
            onFocus={props.eventFocusGained ? () => onFocusGained(props.name, props.context.server) : undefined}
            onBlur={props.eventFocusLost ? () => onFocusLost(props.name, props.context.server) : undefined}
            tabIndex={props.isCellEditor ? -1 : getTabIndex(props.focusable, props.tabIndex)}
        >
            <Tooltip target={!props.isCellEditor ? "#" + checkComponentName(props.name) : undefined} />
            {(props.selectedRow || props.cellEditor.defaultImageName) &&
                <img
                    id={!props.isCellEditor ? checkComponentName(props.name) : undefined}
                    className={concatClassnames(imageStyle, props.style)}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    //style={imageStyle.img}
                    src={props.selectedRow ? "data:image/jpeg;base64," + props.selectedRow : props.context.server.RESOURCE_URL + props.cellEditor.defaultImageName}
                    alt="could not be loaded"
                    onLoad={imageLoaded}
                    onError={e => (e.target as HTMLImageElement).style.display = 'none'}
                    data-pr-tooltip={props.toolTipText}
                    data-pr-position="left"
                {...popupMenu}
                />}
        </span>

    )
}
export default UIEditorImage