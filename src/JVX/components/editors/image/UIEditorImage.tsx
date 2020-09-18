import React, {FC, useLayoutEffect, useRef} from "react";
import placeHolder from "../../../../assests/IMAGE.png"
import useLayout from "../../zhooks/useLayout";
import {ICellEditor, IEditor} from "../IEditor";

interface ICellEditorImage extends ICellEditor{
    defaultImageName: string,
    preserveAspectRatio: boolean
}

export interface IEditorImage extends IEditor{
    cellEditor: ICellEditorImage
    placeholderVisible: boolean,
}

const UIEditorImage: FC<IEditorImage> = (props) => {

    const layoutStyle = useLayout(props.id);

    const imageLoaded = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        if(props.preferredSize){
            const size = props.preferredSize.split(",");
            props.onLoadCallback(props.id, parseInt(size[1]), parseInt(size[0]));
        } else {
            const size = {width: event.currentTarget.width, height: event.currentTarget.height}
            props.onLoadCallback(props.id, size.height, size.width);
        }
    }

    return(
        <img
            style={layoutStyle}
            src={placeHolder}
            alt={"could not be loaded"}
            onLoad={imageLoaded}
        />
    )
}
export default UIEditorImage