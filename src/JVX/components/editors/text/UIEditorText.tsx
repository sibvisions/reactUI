import React, {FC, useContext, useLayoutEffect, useRef, useState} from "react";
import {InputText} from "primereact/inputtext";
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";
import {jvxContext} from "../../../jvxProvider";
import {createSetValuesRequest} from "../../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";

interface ICellEditorText extends ICellEditor{
    preferredEditorMode?: number
}

export interface IEditorText extends IEditor{
    cellEditor?: ICellEditorText
}

const UIEditorText: FC<IEditorText> = (baseProps) => {

    const inputRef = useRef(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IEditorText>(baseProps.id, baseProps);
    const [selectedRow] = useRowSelect(props.dataRow, props.columnName);
    const lastValue = useRef<any>();

    const [text, setText] = useState(baseProps.text || "");
    const {onLoadCallback, id} = baseProps;

    const sendSetValue = () => {
        const req =  createSetValuesRequest();
        req.dataProvider = props.dataRow;
        req.componentId = props.name;
        req.columnNames = [props.columnName];
        req.values = [text];

        lastValue.current = text;
        context.server.sendRequest(req, REQUEST_ENDPOINTS.SET_VALUES);
    }

    const onBlurCallback = () => {
        if(baseProps.onSubmit)
            baseProps.onSubmit()
        if(text && text !== lastValue.current)
            sendSetValue();
    }

    const handleKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if(event.key === "Enter")
            sendSetValue();
    }

    useLayoutEffect(() => {
        if(onLoadCallback && inputRef.current){
            // @ts-ignore
            const size: Array<DOMRect> = inputRef.current.element.getClientRects();
            if(onLoadCallback)
                onLoadCallback(id, size[0].height, size[0].width);
        }
    }, [onLoadCallback, id]);

    useLayoutEffect(() => {
        setText(selectedRow);
        lastValue.current = selectedRow;
    },[selectedRow]);

    return(
        <InputText
            autoFocus={true}
            ref={inputRef}
            style={layoutValue.get(props.id) || baseProps.style}
            disabled={!props["cellEditor.editable"]}
            value={text || ""}
            onChange={event => setText(event.currentTarget.value)}
            onBlur={onBlurCallback}
            onKeyDown={handleKey}
        />
    )
}
export default UIEditorText