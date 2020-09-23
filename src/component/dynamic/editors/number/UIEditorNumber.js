import useRowSelect from "../../../hooks/useRowSelect";
import "./UIEditorNumber.scss"
import React, { useRef, useEffect, useContext, useLayoutEffect } from 'react';
import { InputNumber } from "primereact/inputnumber";
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';
import { getPreferredSize } from "../../../helper/GetSizes";
import { RefContext } from "../../../helper/Context";
import { sendSetValues } from "../../../helper/SendSetValues";

function UIEditorNumber(props) {
    const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue, props.id, props.dataRow);
    const inputRef = useRef();
    const con = useContext(RefContext);
    const metaData = con.contentStore.metaData.get(props.dataRow);
    const scaleDigits = metaData.columns.get(props.columnName).cellEditor.scale ? metaData.columns.get(props.columnName).cellEditor.scale : null;
    const length = scaleDigits > 0 ? (metaData.columns.get(props.columnName).cellEditor.length ? metaData.columns.get(props.columnName).cellEditor.length : null) :
    (metaData.columns.get(props.columnName).cellEditor.precision ? metaData.columns.get(props.columnName).cellEditor.precision : null);

    useEffect(() => {
        inputRef.current.inputEl.setAttribute('maxlength', length);
        inputRef.current.inputEl.onkeydown = () => {
            if (inputRef.current.inputEl.value.length === inputRef.current.inputEl.maxLength) {
                return false;
            }
        }
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props), 
                id: props.id, 
                parent: props.parent
            }
        );
    }, [con, props, length]);

    useLayoutEffect(() => {
        let currElem = inputRef.current.inputEl;
        if(currElem){
            const alignments = checkCellEditorAlignments(props);
            currElem.style.setProperty('background-color', props['cellEditor.background']);
            currElem.style.setProperty('text-align', alignments.ha);
            currElem.style.setProperty('height', '100%');
            currElem.style.setProperty('width', '100%');
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
            onChange={change => editColumn(change.value)}
            onBlur={() => sendSetValues(con, props.rowId, props.dataRow, props.name, props.columnName, selectedColumn)}
            disabled={!props["cellEditor.editable"]}
        />
    )
}
export default UIEditorNumber