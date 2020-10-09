import React, {FC, useContext} from "react";
import placeHolder from "../../../../assests/IMAGE.png"
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
        <img
            style={layoutValue.get(props.id)}
            src={placeHolder}
            alt={"could not be loaded"}
            onLoad={imageLoaded}
        />
    )
}
export default UIEditorImage