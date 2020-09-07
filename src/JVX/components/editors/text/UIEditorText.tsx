import React, {FC, useLayoutEffect, useRef} from "react";
import {InputText} from "primereact/inputtext";
import useLayout from "../../zhooks/useLayout";
import {ICellEditor, IEditor} from "../IEditor";

interface ICellEditorText extends ICellEditor{
    preferredEditorMode: number
}

export interface IEditorText extends IEditor{
    cellEditor: ICellEditorText
}

const UIEditorText: FC<IEditorText> = (props) => {

    const inputRef = useRef(null);
    const layoutStyle = useLayout(props.id);


    useLayoutEffect(() => {
        if(!layoutStyle && props.onLoadCallback && inputRef.current){
            // @ts-ignore
            const size: Array<DOMRect> = inputRef.current.element.getClientRects();
            props.onLoadCallback(props.id, size[0].height, size[0].width);
        }
    });

    return(
        <InputText ref={inputRef} style={layoutStyle}>

        </InputText>
    )
}
export default UIEditorText