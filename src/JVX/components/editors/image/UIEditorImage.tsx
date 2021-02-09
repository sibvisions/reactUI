import React, {FC, useContext, useEffect} from "react";
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import useRowSelect from "../../zhooks/useRowSelect";
import {jvxContext} from "../../../jvxProvider";
import useProperties from "../../zhooks/useProperties";
import useImageStyle from "../../zhooks/useImageStyle";
import Size from "../../util/Size";
import { parseJVxSize } from "../../util/parseJVxSize";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import { getEditorCompId } from "../../util/GetEditorCompId";

interface ICellEditorImage extends ICellEditor{
    defaultImageName: string,
    preserveAspectRatio: boolean
}

export interface IEditorImage extends IEditor{
    cellEditor: ICellEditorImage
    placeholderVisible: boolean,
}

const UIEditorImage: FC<IEditorImage> = (baseProps) => {

    const layoutValue = useContext(LayoutContext);
    const context = useContext(jvxContext);
    const [props] = useProperties<IEditorImage>(baseProps.id, baseProps);
    const compId = getEditorCompId(props.id, context.contentStore, props.dataRow);
    const {onLoadCallback, id} = baseProps
    const {verticalAlignment, horizontalAlignment} = props
    const imageStyle = useImageStyle(horizontalAlignment, verticalAlignment, props.cellEditor_horizontalAlignment_, props.cellEditor_verticalAlignment_);

    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);

    useEffect(() => {
        if (!props.cellEditor.defaultImageName) {
            const prefSize:Size = {width: 0, height: 0}
            if (props.preferredSize) {
                const parsedSize = parseJVxSize(props.preferredSize) as Size
                prefSize.height = parsedSize.height;
                prefSize.width = parsedSize.width;
            }
            if (onLoadCallback)
                sendOnLoadCallback(id, prefSize, parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), undefined, onLoadCallback)
        }
    },[onLoadCallback, id, props.cellEditor.defaultImageName, props.preferredSize, props.maximumSize, props.minimumSize])

    const imageLoaded = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const prefSize:Size = {width: 0, height: 0}
        if(props.preferredSize){
            const parsedSize = parseJVxSize(props.preferredSize) as Size
            prefSize.height = parsedSize.height;
            prefSize.width = parsedSize.width;
        } else {
            prefSize.height = event.currentTarget.height;
            prefSize.width = event.currentTarget.width;
        }

        if(onLoadCallback)
            sendOnLoadCallback(id, prefSize, parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), undefined, onLoadCallback)
    }

    return(
        <span className="rc-editor-image" style={{...layoutValue.get(props.id), ...imageStyle.span}}>
            <img
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