import React, {FC, useContext, useLayoutEffect, useRef} from "react";
import {InputText} from "primereact/inputtext";
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";

interface ICellEditorText extends ICellEditor{
    preferredEditorMode: number
}

export interface IEditorText extends IEditor{
    cellEditor: ICellEditorText
}

const UIEditorText: FC<IEditorText> = (baseProps) => {

    const inputRef = useRef(null);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IEditorText>(baseProps.id, baseProps);

    useLayoutEffect(() => {
        if(props.onLoadCallback && inputRef.current){
            // @ts-ignore
            const size: Array<DOMRect> = inputRef.current.element.getClientRects();
            props.onLoadCallback(props.id, size[0].height, size[0].width);
        }
    }, [props, inputRef]);

    return(
        <InputText ref={inputRef} style={layoutValue.get(props.id)} disabled={!props["cellEditor.editable"]}>

        </InputText>
    )
}
export default UIEditorText