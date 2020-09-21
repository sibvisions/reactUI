import React, {FC, useContext, useLayoutEffect, useRef} from "react";
import placeHolder from "../../../../assests/IMAGE.png"
import useLayout from "../../zhooks/useLayout";
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";

interface ICellEditorImage extends ICellEditor{
    defaultImageName: string,
    preserveAspectRatio: boolean
}

export interface IEditorImage extends IEditor{
    cellEditor: ICellEditorImage
    placeholderVisible: boolean,
}

const UIEditorImage: FC<IEditorImage> = (props) => {

    const layoutValue = useContext(LayoutContext);

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
            style={layoutValue.get(props.id)}
            src={placeHolder}
            alt={"could not be loaded"}
            onLoad={imageLoaded}
        />
    )
}
export default UIEditorImage