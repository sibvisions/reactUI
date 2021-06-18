/** React imports */
import React, { FC, useContext, useEffect } from "react";

/** Hook imports */
import { useProperties, useRowSelect, useImageStyle, useLayoutValue } from "../../zhooks";

/** Other imports */
import { ICellEditor, IEditor } from "..";
import { LayoutContext } from "../../../LayoutContext";
import { appContext } from "../../../AppProvider";
import { getEditorCompId, parsePrefSize, parseMinSize, parseMaxSize, Dimension, sendOnLoadCallback } from "../../util";

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
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIEditorImage: FC<IEditorImage> = (baseProps) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IEditorImage>(baseProps.id, baseProps);

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id);

    /** ComponentId of the screen */
    const compId = getEditorCompId(props.id, context.contentStore);

    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps

    /** Extracting alignments from props */
    const {verticalAlignment, horizontalAlignment} = props

    /**CSS properties for ImageViewer */
    const imageStyle = useImageStyle(horizontalAlignment, verticalAlignment, props.cellEditor_horizontalAlignment_, props.cellEditor_verticalAlignment_);

    /** If the editor is a cell-editor */
    const isCellEditor = props.id === "";

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
        if(props.preferredSize){
            const parsedSize = parsePrefSize(props.preferredSize) as Dimension
            prefSize.height = parsedSize.height;
            prefSize.width = parsedSize.width;
        } else {
            prefSize.height = event.currentTarget.height;
            prefSize.width = event.currentTarget.width;
        }

        if(onLoadCallback)
            sendOnLoadCallback(id, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback)
    }

    return(
        <span className="rc-editor-image" style={{...layoutStyle, ...imageStyle.span}}>
            <img
                id={!isCellEditor ? props.name : undefined}
                style={imageStyle.img}
                src={ selectedRow ? "data:image/jpeg;base64," + selectedRow : context.server.RESOURCE_URL + props.cellEditor.defaultImageName}
                alt="could not be loaded"
                onLoad={imageLoaded}
                onError={e => (e.target as HTMLImageElement).style.display = 'none'}
            />
        </span>

    )
}
export default UIEditorImage