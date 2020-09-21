import React, { useEffect, useContext } from 'react';
import useRowSelect from '../../../hooks/useRowSelect';
import { RefContext } from '../../../helper/Context';
import { InputTextarea } from 'primereact/inputtextarea';
import { getPreferredSize } from '../../../helper/GetSizes';
import { sendSetValues } from '../../../helper/SendSetValues';

function UIEditorTextArea(props) {
    const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue || "", props.id);
    const con = useContext(RefContext);

    useEffect(() => {
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props), 
                id: props.id, 
                parent: props.parent
            }
        );
    }, [con, props]);

    return (
        <InputTextarea 
            id={props.id}
            value={selectedColumn}
            style={{...props.layoutStyle, resize: 'none'}}    
            onChange={change => editColumn(change.target.value, props.columnName)}
            onBlur={() => sendSetValues(con, props.rowId, props.dataRow, props.name, props.columnName, selectedColumn)}
            disabled={!props["cellEditor.editable"]}
        />
    )
}
export default UIEditorTextArea