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
import { parseJVxSize } from "../../util/parseJVxSize";

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
    const compId = context.contentStore.getComponentId(props.id) as string;
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);
    const lastValue = useRef<any>();

    const [value, setValue] = useState(parseInt(baseProps.text || ""));
    const {onLoadCallback, id} = baseProps;

    const cellEditorMetaData:IEditorNumber|undefined = context.contentStore.dataProviderMetaData.get(compId)?.get(props.dataRow)?.columns.find(column => column.name === props.columnName) as IEditorNumber;
    console.log(cellEditorMetaData)
    const scaleDigits = useMemo(() => cellEditorMetaData.cellEditor.scale !== undefined ? (cellEditorMetaData.cellEditor.scale < 0 ? 2 : cellEditorMetaData.cellEditor.scale) : undefined, [cellEditorMetaData.cellEditor.scale]);
    const length = useMemo(() => cellEditorMetaData.cellEditor.precision ? (scaleDigits === 0 ? cellEditorMetaData.cellEditor.precision : cellEditorMetaData.cellEditor.precision+1) : null, [cellEditorMetaData.cellEditor.precision, scaleDigits]);

    console.log(scaleDigits, length)

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
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), inputRef.current.element, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

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