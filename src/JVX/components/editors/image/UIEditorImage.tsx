import React, {FC, useContext, useEffect, useRef} from "react";
import './UIEditorImage.scss'
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import useRowSelect from "../../zhooks/useRowSelect";
import {jvxContext} from "../../../jvxProvider";
import useProperties from "../../zhooks/useProperties";
import useImageStyle from "../../zhooks/useImageStyle";

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
    const imageRef = useRef<HTMLImageElement>(null);
    const [props] = useProperties<IEditorImage>(baseProps.id, baseProps);

    const {onLoadCallback, id} = baseProps
    const {verticalAlignment, horizontalAlignment} = props
    const imageStyle = useImageStyle(horizontalAlignment, verticalAlignment, props.cellEditor_horizontalAlignment_, props.cellEditor_verticalAlignment_);

    const [selectedRow] = useRowSelect(props.dataRow, props.columnName);

    useEffect(() => {
        if (!props.cellEditor.defaultImageName) {
            let height = 0, width = 0;
            if (props.preferredSize) {
                const size = props.preferredSize.split(',');
                width = parseInt(size[0]);
                height = parseInt(size[1]);
            }
            if (onLoadCallback)
                onLoadCallback(id, height, width)
        }
    },[onLoadCallback, id, props.cellEditor.defaultImageName, props.preferredSize])

    const imageLoaded = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        let height: number, width: number
        if(props.preferredSize){
            const size = props.preferredSize.split(",");
            height = parseInt(size[1]);
            width = parseInt(size[0]);
        } else {
            height = event.currentTarget.height;
            width = event.currentTarget.width;
        }

        if(props.onLoadCallback){
            props.onLoadCallback(props.id, height, width);
        }
    }

    return(
        <span className="jvxEditorImage" style={{...layoutValue.get(props.id), ...imageStyle.span}}>
            <img
                style={imageStyle.img}
                ref={imageRef}
                src={ selectedRow ? "data:image/jpeg;base64," + selectedRow : context.server.RESOURCE_URL + props.cellEditor.defaultImageName}
                alt={"could not be loaded"}
                onLoad={imageLoaded}
                onError={e => (e.target as HTMLImageElement).style.display = 'none'}
            />
        </span>

    )
}
export default UIEditorImage