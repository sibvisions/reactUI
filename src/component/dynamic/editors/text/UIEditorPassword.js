import React, { useEffect, useContext } from 'react';
import useRowSelect from '../../../hooks/useRowSelect';
import { RefContext } from '../../../helper/Context';
import {Password} from 'primereact/password';
import { getPreferredSize } from '../../../helper/GetSizes';

function UIEditorPassword(props) {
    const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue || "", props.id);
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

    return (
        <Password 
            id={props.id} 
            value={selectedColumn} 
            style={props.layoutStyle} 
            feedback={false}
            onChange={change => editColumn(change.target.value, props.columnName)}
            disabled={!props["cellEditor.editable"]}
        />
    )
}
export default UIEditorPassword