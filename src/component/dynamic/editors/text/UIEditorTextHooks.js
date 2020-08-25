import React, { useEffect, useRef } from 'react';
import "./UIEditorText.scss"
import { InputText } from 'primereact/inputtext';
import useRowSelect from '../../../hooks/useRowSelect';
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';


function UIEditorTextHooks(props){
    const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue || "");
    const inputRef = useRef()

    useEffect(() => {
        if(inputRef.current.element){
            const alignments = checkCellEditorAlignments(props);
            inputRef.current.element.style['background-color'] = props['cellEditor.background'];
            inputRef.current.element.style['text-align'] = alignments.ha;
        }
    });
    
    return (
        <InputText
            ref={inputRef}
            id={props.id}
            value={selectedColumn}
            style={props.layoutStyle}
            onChange={change => {editColumn(change.target.value, props.columnName)}}
            disabled={!props["cellEditor.editable"]}
        />
    );
}
export default UIEditorTextHooks






