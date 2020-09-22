import React, { useContext, useEffect } from 'react';
import {Checkbox} from 'primereact/checkbox';
import { getPreferredSize } from '../../../helper/GetSizes';
import { RefContext } from '../../../helper/Context';
import { getAlignments } from '../../ComponentProperties';
import { sendSetValues } from '../../../helper/SendSetValues';
import useRowSelect from '../../../hooks/useRowSelect';

function UIEditorCheckbox(props) {
    const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue || "", props.id, props.dataRow);
    const cbxType = getCbxType(props.cellEditor.selectedValue)
    const con = useContext(RefContext);
    const alignments = getAlignments(props);

    useEffect(() => {
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props),
                id: props.id,
                parent: props.parent
            }
        );
    }, [props, con]);

    function getColumnValue(curr, type) {
        if (curr) {
            switch (type) {
                case 'STRING': return 'N';
                case 'NUMBER': return 0;
                default: return false;
            }
        }
        else {
            switch (type) {
                case 'STRING': return 'Y';
                case 'NUMBER': return 1;
                default: return true;
            }
        }
    }

    function getCbxType(selectedValue) {
        if (selectedValue === 'Y') {
            return 'STRING';
        }
        else if (selectedValue === 1) {
            return 'NUMBER';
        }
        else {
            return 'BOOLEAN';
        }
    }

    function getBooleanValue(input) {
        if (input === 'Y' || input === true || input === 1) {
            return true;
        }
        else {
            return false;
        }
    }

    return (
        <span id={props.id} style={{
            ...props.layoutStyle,
            display: "inline-flex",
            background: props["cellEditor.background"],
            justifyContent: alignments.ha,
            alignContent: alignments.va
        }}>
            <Checkbox 
                inputId={props.id} 
                onChange={() => {
                    editColumn(getColumnValue(getBooleanValue(selectedColumn), cbxType), props.columnName);
                    sendSetValues(con, props.rowId, props.dataRow, props.name, props.columnName, getColumnValue(getBooleanValue(selectedColumn), cbxType))
                }} 
                checked={getBooleanValue(selectedColumn)} 
                disabled={!props["cellEditor.editable"]} />
            <label htmlFor={props.id}>{props.cellEditor.text}</label>
        </span>
    )
}
export default UIEditorCheckbox;