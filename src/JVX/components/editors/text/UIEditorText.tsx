import React, {FC, useContext, useLayoutEffect, useRef} from "react";
import {InputText} from "primereact/inputtext";
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";

interface ICellEditorText extends ICellEditor{
    preferredEditorMode: number
}

export interface IEditorText extends IEditor{
    cellEditor: ICellEditorText
}

const UIEditorText: FC<IEditorText> = (props) => {

    const inputRef = useRef(null);
    const layoutValue = useContext(LayoutContext);

    useLayoutEffect(() => {
        if(props.onLoadCallback && inputRef.current){
            // @ts-ignore
            const size: Array<DOMRect> = inputRef.current.element.getClientRects();
            props.onLoadCallback(props.id, size[0].height, size[0].width);
        }
    }, [props, inputRef]);

    return(
        <InputText ref={inputRef} style={layoutValue.get(props.id)}>

        </InputText>
    )
}
export default UIEditorText