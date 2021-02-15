import React, {FC, useContext, useLayoutEffect, useMemo, useRef, useState} from "react";
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
import { getEditorCompId } from "../../util/GetEditorCompId";
import { getDecimalLength, getGrouping, getMinimumIntDigits, getNumberLength, getScaleDigits } from "../../util/NumberProperties";

interface ICellEditorNumber extends ICellEditor{
    numberFormat: string,
    preferredEditorMode?: number,
}

export interface IEditorNumber extends IEditor{
    cellEditor: ICellEditorNumber
    label: string
    length: number,
    precision: number,
    scale: number,
}

export interface ScaleType {
    minScale:number,
    maxScale:number,
}

const UIEditorNumber: FC<IEditorNumber> = (baseProps) => {

    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const inputRef = useRef<InputNumber>(null);
    const [props] = useProperties<IEditorNumber>(baseProps.id, baseProps);
    const compId = getEditorCompId(props.id, context.contentStore, props.dataRow);
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);
    const [value, setValue] = useState<number>(selectedRow)
    const lastValue = useRef<any>();
    const {onLoadCallback, id} = baseProps;

    const cellEditorMetaData:IEditorNumber|undefined = context.contentStore.dataProviderMetaData.get(compId)?.
    get(props.dataRow)?.columns.find(column => column.name === props.columnName) as IEditorNumber;

    const scaleDigits:ScaleType = useMemo(() => getScaleDigits(props.cellEditor.numberFormat, cellEditorMetaData.scale),
    [cellEditorMetaData.scale, props.cellEditor.numberFormat]);

    const useGrouping = getGrouping(props.cellEditor.numberFormat);

    const prefixLength = useMemo(() => getMinimumIntDigits(props.cellEditor.numberFormat, selectedRow),
    [props.cellEditor.numberFormat, selectedRow]);

    const length = useMemo(() => getNumberLength(scaleDigits, cellEditorMetaData.precision, cellEditorMetaData.scale, useGrouping, prefixLength), 
    [cellEditorMetaData.precision, cellEditorMetaData.scale, scaleDigits, useGrouping, prefixLength]);

    const decimalLength = useMemo(() => {
        getDecimalLength(cellEditorMetaData.precision, cellEditorMetaData.scale);
    },[cellEditorMetaData.precision, cellEditorMetaData.scale]);

    useLayoutEffect(() => {
        //@ts-ignore
        let currElem = inputRef.current.inputEl;
        if(currElem){
            currElem.setAttribute('maxlength', length);
            currElem.style.setProperty('background', props.cellEditor_background_);
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
        setValue(selectedRow)
        lastValue.current = selectedRow;
    },[selectedRow]);

    const handleKeyDown = (e:any) => {
        const curRef = inputRef.current
        handleEnterKey(e, () => sendSetValues(props.dataRow, props.name, props.columnName, selectedRow, lastValue.current, context.server));
        //@ts-ignore
        if (curRef.inputEl.value.length === curRef.inputEl.maxLength || (decimalLength && parseInt((value ? value.toString().split('.')[0] : "") + e.key).toString().length > decimalLength && curRef.inputEl.selectionStart <= (value ? value.toString().indexOf('.') : 0))) {
            e.preventDefault();
            return false;
        }
    }

    return (
        <InputNumber
            ref={inputRef}
            className="rc-editor-number"
            useGrouping={useGrouping}
            locale={context.contentStore.locale}
            prefix={prefixLength}
            minFractionDigits={scaleDigits.minScale}
            maxFractionDigits={scaleDigits.maxScale}
            value={value}
            style={layoutValue.get(props.id) || baseProps.editorStyle}
            onChange={event => setValue(event.value)}
            onBlur={() => onBlurCallback(baseProps, value, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, value, lastValue.current, context.server))}
            disabled={!props.cellEditor_editable_}
            onKeyDown={handleKeyDown}
        />
    )
}
export default UIEditorNumber