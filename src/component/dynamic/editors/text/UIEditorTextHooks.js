import React, { useEffect, useRef, useContext } from 'react';
import "./UIEditorText.scss"
import { InputText } from 'primereact/inputtext';
import useRowSelect from '../../../hooks/useRowSelect';
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';
import { getHooksPreferredSize } from '../../../helper/GetPreferredSize';
import { RefContext } from '../../../helper/Context';


function UIEditorTextHooks(props){
    const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue || "", props.id);
    const inputRef = useRef();
    const con = useContext(RefContext)

    useEffect(() => {
        if(inputRef.current.element){
            const alignments = checkCellEditorAlignments(props);
            inputRef.current.element.style['background-color'] = props['cellEditor.background'];
            inputRef.current.element.style['text-align'] = alignments.ha;
        }
        con.contentStore.emitSizeCalculated({size: getHooksPreferredSize(props), id: props.id, parent: props.parent, firstTime: true});
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






