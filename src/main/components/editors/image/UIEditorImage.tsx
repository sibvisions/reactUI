/** React imports */
import React, { FC, useContext, useEffect, useMemo, useRef, useState } from "react";

/** Hook imports */
import { useRowSelect, useImageStyle, useLayoutValue, useFetchMissingData, useMouseListener } from "../../zhooks";

/** Other imports */
import { ICellEditor, IEditor } from "..";
import { appContext } from "../../../AppProvider";
import { getEditorCompId, parsePrefSize, parseMinSize, parseMaxSize, Dimension, sendOnLoadCallback, concatClassnames } from "../../util";
import { onFocusGained, onFocusLost } from "../../util/SendFocusRequests";
import { HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT } from "../../layouts";

/** Interface for cellEditor property of ImageViewer */
export interface ICellEditorImage extends ICellEditor{
    defaultImageName: string,
    preserveAspectRatio: boolean
}

/** Interface for ImageViewer */
export interface IEditorImage extends IEditor{
    cellEditor: ICellEditorImage
    placeholderVisible: boolean,
}

/**
 *  This component displays an image
 * @param props - Initial properties sent by the server for this component
 */
const UIEditorImage: FC<IEditorImage> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Reference for wrapper span */
    const wrapRef = useRef<HTMLSpanElement>(null);

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id);

    /** ComponentId of the screen */
    const compId = getEditorCompId(props.id, context.contentStore);

    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);

    /** Extracting onLoadCallback and id from props */
    const {onLoadCallback, id} = props

    /** Extracting alignments from props */
    const {verticalAlignment, horizontalAlignment} = props

    /**CSS properties for ImageViewer */
    const imageStyle = useImageStyle(horizontalAlignment, verticalAlignment, props.cellEditor_horizontalAlignment_, props.cellEditor_verticalAlignment_, props.cellEditor.preserveAspectRatio);

    /** If the editor is a cell-editor */
    const isCellEditor = props.id === "";

    useFetchMissingData(compId, props.dataRow);

    /** Hook for MouseListener */
    useMouseListener(props.name, wrapRef.current ? wrapRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    useEffect(() => {
        if (!props.cellEditor.defaultImageName) {
            const prefSize:Dimension = {width: 0, height: 0}
            if (props.preferredSize) {
                const parsedSize = parsePrefSize(props.preferredSize) as Dimension
                prefSize.height = parsedSize.height;
                prefSize.width = parsedSize.width;
            }
            if (onLoadCallback)
                sendOnLoadCallback(id, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback)
        }
    },[onLoadCallback, id, props.cellEditor.defaultImageName, props.preferredSize, props.maximumSize, props.minimumSize])

    /**
     * When the image is loaded, measure the image and then report its preferred-, minimum-, maximum and measured-size to the layout
     * @param event - image load event
     */
    const imageLoaded = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
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

        if(onLoadCallback) {
            sendOnLoadCallback(id, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback);
        }   
    }

    return(
        <span 
            ref={wrapRef} 
            className="rc-editor-image" 
            style={{...layoutStyle, overflow: "hidden"}} 
            aria-label={props.ariaLabel}
            onFocus={props.eventFocusGained ? () => onFocusGained(props.name, context.server) : undefined}
            onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
            tabIndex={selectedRow || props.cellEditor.defaultImageName ? (props.tabIndex ? props.tabIndex : 0) : undefined}
        >
            <img
                id={!isCellEditor ? props.name : undefined}
                className={imageStyle}
                //style={imageStyle.img}
                src={selectedRow ? "data:image/jpeg;base64," + selectedRow : context.server.RESOURCE_URL + props.cellEditor.defaultImageName}
                alt="could not be loaded"
                onLoad={imageLoaded}
                onError={e => (e.target as HTMLImageElement).style.display = 'none'}
            />
        </span>

    )
}
export default UIEditorImage