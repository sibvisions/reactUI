import React, {FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import "./UIEditorNumber.scss"
import {InputNumber} from "primereact/inputnumber";
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";
import {jvxContext} from "../../../jvxProvider";
import {sendSetValues} from "../../util/SendSetValues";
import {handleEnterKey} from "../../util/HandleEnterKey";
import {onBlurCallback} from "../../util/OnBlurCallback";
import { checkCellEditorAlignments } from "../../compprops/CheckAlignments";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";

interface ICellEditorNumber extends ICellEditor{
    scale?: number,
    length?: number,
    precision?: number,
    preferredEditorMode?: number
}

export interface IEditorNumber extends IEditor{
    cellEditor: ICellEditorNumber
}

const UIEditorNumber: FC<IEditorNumber> = (baseProps) => {

    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const inputRef = useRef<InputNumber>(null);
    const [props] = useProperties<IEditorNumber>(baseProps.id, baseProps);
    const [selectedRow] = useRowSelect(props.dataRow, props.columnName);
    const lastValue = useRef<any>();

    const [value, setValue] = useState(parseInt(baseProps.text || ""));
    const {onLoadCallback, id} = baseProps;

    const scaleDigits = useMemo(() => props.cellEditor.scale !== undefined ? (props.cellEditor.scale < 0 ? 2 : props.cellEditor.scale) : undefined, [props.cellEditor.scale]);
    const length = useMemo(() => props.cellEditor.precision ? props.cellEditor.precision+1 : null, [props.cellEditor.precision]);

    useLayoutEffect(() => {
        //@ts-ignore
        let currElem = inputRef.current.inputEl;
        if(currElem){
            currElem.style.setProperty('background-color', props.cellEditor_background_);
            currElem.style.setProperty('text-align', checkCellEditorAlignments(props).ha);
        }
    })

    useLayoutEffect(() => {
        if (onLoadCallback && inputRef.current) {
            // @ts-ignore
            sendOnLoadCallback(id, props.preferredSize, inputRef.current.element, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize]);

    useLayoutEffect(() => {
        setValue(selectedRow);
        lastValue.current = selectedRow;
    },[selectedRow]);

    useEffect(() => {
        //@ts-ignore
        inputRef.current.inputEl.setAttribute('maxlength', length);
        //@ts-ignore
        inputRef.current.inputEl.onkeydown = (event) => {
            handleEnterKey(event, () => sendSetValues(props.dataRow, props.name, props.columnName, value, lastValue.current, context.server));
            //@ts-ignore
            if (inputRef.current.inputEl.value.length === inputRef.current.inputEl.maxLength) {
                return false;
            }
        }
    });

    useEffect(() => {
        if(baseProps.autoFocus) {
            //@ts-ignore
            inputRef.current?.inputEl?.focus?.()
        }
    }, [baseProps.autoFocus])

    return (
        <InputNumber
            ref={inputRef}
            className="jvxEditorNumber"
            mode="decimal"
            useGrouping={false}
            minFractionDigits={scaleDigits}
            maxFractionDigits={scaleDigits}
            value={value}
            style={layoutValue.get(props.id) || baseProps.editorStyle}
            onChange={event => setValue(event.value)}
            onBlur={() => onBlurCallback(baseProps, value, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, value, lastValue.current, context.server))}
            disabled={!props.cellEditor_editable_}
        />
    )
}
export default UIEditorNumber