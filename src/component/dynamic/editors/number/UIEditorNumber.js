import useRowSelect from "../../../hooks/useRowSelect";
import "./UIEditorNumber.scss"
import React, { useRef, useEffect, useContext, useLayoutEffect } from 'react';
import { InputNumber } from "primereact/inputnumber";
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';
import { getPreferredSize } from "../../../helper/GetSizes";
import { RefContext } from "../../../helper/Context";

function UIEditorNumber(props) {
    const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue, props.id);
    const inputRef = useRef();
    const con = useContext(RefContext);
    const scaleDigits = con.contentStore.metaData.get(props.columnName) ? con.contentStore.metaData.get(props.columnName).cellEditor.scale : null;


    useEffect(() => {
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props), 
                id: props.id, 
                parent: props.parent
            }
        );
    });

    useLayoutEffect(() => {
        if(inputRef.current.inputEl){
            const alignments = checkCellEditorAlignments(props);
            inputRef.current.inputEl.style.setProperty('background-color', props['cellEditor.background']);
            inputRef.current.inputEl.style.setProperty('text-align', alignments.ha);
            inputRef.current.inputEl.style.setProperty('height', '100%');
            inputRef.current.inputEl.style.setProperty('width', '100%');
        }
    })

    return(
        <InputNumber
            id={props.id}
            ref={inputRef}
            mode="decimal"
            useGrouping={false}
            minFractionDigits={scaleDigits}
            maxFractionDigits={scaleDigits}
            value={selectedColumn}
            style={props.layoutStyle}
            onChange={changeEvent => {
                console.log(changeEvent.value)
                editColumn(changeEvent.value)
            }}
            disabled={!props["cellEditor.editable"]}
        />
    )
}
export default UIEditorNumber