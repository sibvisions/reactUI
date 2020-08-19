import useRowSelect from "../../../hooks/useRowSelect";
import React, { useRef, useEffect } from 'react';
import { InputNumber } from "primereact/inputnumber";
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';

function UIEditorNumberHooks(props) {
    const [selectedColumn, editColumn] = useRowSelect(props.columnName);
    const inputRef = useRef()


    useEffect(() => {
        if(inputRef.current.inputEl){
            const alignments = checkCellEditorAlignments(props);
            inputRef.current.inputEl.style['background-color'] = props['cellEditor.background'];
            inputRef.current.inputEl.style['text-align'] = alignments.ha;
        }
    });

    return(
        <InputNumber
            id={props.id}
            ref={inputRef}
            useGrouping={false}
            value={selectedColumn}
            style={props.layoutStyle}
            onChange={changeEvent => editColumn(changeEvent.target.value)}
            disabled={!props["cellEditor.editable"]}
        />
    )
}
export default UIEditorNumberHooks