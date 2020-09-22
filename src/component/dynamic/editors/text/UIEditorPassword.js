import React, { useEffect, useContext, useLayoutEffect, useRef } from 'react';
import useRowSelect from '../../../hooks/useRowSelect';
import { RefContext } from '../../../helper/Context';
import {Password} from 'primereact/password';
import { getPreferredSize } from '../../../helper/GetSizes';
import { sendSetValues } from '../../../helper/SendSetValues';
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';

function UIEditorPassword(props) {
    const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue || "", props.id);
    const inputRef = useRef();
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

    useLayoutEffect(() => {
        if (inputRef.current.element) {
            const alignments = checkCellEditorAlignments(props);
            inputRef.current.element.style['background-color'] = props['cellEditor.background'];
            inputRef.current.element.style['text-align'] = alignments.ha;
        }
    })

    return (
        <Password 
            id={props.id}
            ref={inputRef}
            value={selectedColumn} 
            style={props.layoutStyle} 
            feedback={false}
            onChange={change => editColumn(change.target.value, props.columnName)}
            onBlur={() => sendSetValues(con, props.rowId, props.dataRow, props.name, props.columnName, selectedColumn)}
            disabled={!props["cellEditor.editable"]}
        />
    )
}
export default UIEditorPassword