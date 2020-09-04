import React, { useEffect, useRef, useContext, useLayoutEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import useRowSelect from '../../../hooks/useRowSelect';
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';
import { getPreferredSize } from '../../../helper/GetSizes';
import { RefContext } from '../../../helper/Context';


function UIEditorTextHooks(props){
    const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue || "", props.id);
    const inputRef = useRef();
    const con = useContext(RefContext)

    useEffect(() => {
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props), 
                id: props.id, 
                parent: props.parent
            }
        );
    }, [con, props]);

    useLayoutEffect(() => {
        if(inputRef.current.element){
            const alignments = checkCellEditorAlignments(props);
            inputRef.current.element.style['background-color'] = props['cellEditor.background'];
            inputRef.current.element.style['text-align'] = alignments.ha;
        }
    })
    
    return (
        <InputText
            ref={inputRef}
            id={props.id}
            value={selectedColumn}
            style={props.layoutStyle}
            onChange={change => editColumn(change.value, props.columnName)}
            disabled={!props["cellEditor.editable"]}
        />
    );
}
export default UIEditorTextHooks