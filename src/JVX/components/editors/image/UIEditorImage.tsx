import React, {FC, useLayoutEffect} from "react";
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

    useLayoutEffect(() => {
        if(!layoutStyle && props.onLoadCallback && props.preferredSize){
            const size = props.preferredSize.split(",");
            props.onLoadCallback(props.id, parseInt(size[0]), parseInt(size[1]));
        }
    });


    return(
        <img
            style={layoutStyle}
            src={placeHolder}
            alt={"could not be loaded"}
        />
    )
}
export default UIEditorImage