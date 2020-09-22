import React, { useEffect, useRef, useContext, useLayoutEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import useRowSelect from '../../../hooks/useRowSelect';
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';
import { getPreferredSize } from '../../../helper/GetSizes';
import { RefContext } from '../../../helper/Context';
import { sendSetValues } from '../../../helper/SendSetValues';


function UIEditorText(props) {
    const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue || "", props.id, props.dataRow);
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
        let currElem = inputRef.current.element;
        if(currElem){
            const alignments = checkCellEditorAlignments(props);
            currElem.style.setProperty('text-align', alignments.ha);
            if (props.borderVisible === false) {
                currElem.style.setProperty('background-color', 'transparent');
                currElem.style.setProperty('border', 'none');
            }
            else {
                currElem.style.setProperty('background-color', props['cellEditor.background']);
            }
            
        }
    })
    
    return (
        <InputText
            id={props.id}
            ref={inputRef}
            value={selectedColumn}
            style={props.layoutStyle}
            onChange={change => editColumn(change.target.value, props.columnName)}
            onBlur={() => sendSetValues(con, props.rowId, props.dataRow, props.name, props.columnName, selectedColumn)}
            disabled={!props["cellEditor.editable"]}
        />
    );
}
export default UIEditorText