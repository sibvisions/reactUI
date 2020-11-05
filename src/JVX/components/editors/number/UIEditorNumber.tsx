import React, {FC, useContext, useEffect, useLayoutEffect, useRef, useState} from "react";
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

interface ICellEditorNumber extends ICellEditor{
    scale?: number,
    length?: number,
    precision?: number,
    preferredEditorMode?: number
}

export interface IEditorNumber extends IEditor{
    cellEditor?: ICellEditorNumber
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

    const cellEditorMetaData:IEditorNumber|undefined = context.contentStore.dataProviderMetaData.get(props.dataRow)?.columns.find(column => column.name === props.columnName);
    const scaleDigits = cellEditorMetaData?.cellEditor?.scale !== undefined ? (cellEditorMetaData.cellEditor.scale < 0 ? 2 : cellEditorMetaData.cellEditor.scale) : undefined;
    const length = cellEditorMetaData?.cellEditor?.precision ? cellEditorMetaData?.cellEditor.precision : null

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
            const size: Array<DOMRect> = inputRef.current.element.getClientRects();
            onLoadCallback(id, size[0].height, size[0].width);
        }
    },[onLoadCallback, id]);

    useLayoutEffect(() => {
        setValue(selectedRow);
        lastValue.current = selectedRow;
    },[selectedRow]);


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