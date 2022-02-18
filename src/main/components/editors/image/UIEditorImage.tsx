/** React imports */
import React, { FC, useEffect, useRef } from "react";

/** Hook imports */
import { useImageStyle, useFetchMissingData, useMouseListener, usePopupMenu, useEditorConstants } from "../../zhooks";

/** Other imports */
import { ICellEditor, IEditor } from "..";
import { parsePrefSize, parseMinSize, parseMaxSize, Dimension, sendOnLoadCallback, concatClassnames } from "../../util";
import { onFocusGained, onFocusLost } from "../../util/SendFocusRequests";
import { Tooltip } from "primereact/tooltip";

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
const UIEditorImage: FC<IEditorImage> = (baseProps) => {
    /** Use context to gain access for contentstore and server methods */
    //const context = useContext(appContext);

    /** Reference for wrapper span */
    const wrapRef = useRef<HTMLSpanElement>(null);

    const [context, topbar, [props], layoutStyle, translations, compId, columnMetaData, [selectedRow], cellStyle] = useEditorConstants<IEditorImage>(baseProps, baseProps.editorStyle);

    /** Extracting onLoadCallback and id from props */
    const {onLoadCallback, id} = props

    /** Extracting alignments from props */
    const {verticalAlignment, horizontalAlignment} = props

    /**CSS properties for ImageViewer */
    const imageStyle = useImageStyle(horizontalAlignment, verticalAlignment, props.cellEditor_horizontalAlignment_, props.cellEditor_verticalAlignment_, props.cellEditor.preserveAspectRatio);

    useFetchMissingData(compId, props.dataRow);

    /** Hook for MouseListener */
    useMouseListener(props.name, wrapRef.current ? wrapRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    const popupMenu = usePopupMenu(props);

    useEffect(() => {
        if (!props.cellEditor.defaultImageName || !selectedRow) {
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
                columnMetaData?.nullable === false ? "required-field" : ""
            )}
            style={{ ...layoutStyle, ...cellStyle, overflow: "hidden", caretColor: "transparent" }}
            aria-label={props.ariaLabel}
            onFocus={props.eventFocusGained ? () => onFocusGained(props.name, context.server) : undefined}
            onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
            tabIndex={selectedRow || props.cellEditor.defaultImageName ? (props.tabIndex ? props.tabIndex : 0) : undefined}
        >
            <Tooltip target={!props.isCellEditor ? "#" + props.name : undefined} />
            {(selectedRow || props.cellEditor.defaultImageName) &&
                <img
                    id={!props.isCellEditor ? props.name : undefined}
                    className={imageStyle}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    //style={imageStyle.img}
                    src={selectedRow ? "data:image/jpeg;base64," + selectedRow : context.server.RESOURCE_URL + props.cellEditor.defaultImageName}
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