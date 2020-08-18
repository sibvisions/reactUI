import React from 'react';
import { InputText } from 'primereact/inputtext';
import useRowSelect from '../../../hooks/useRowSelect';


export function UIEditorTextHooks(props){
    const [selectedRow, editRow] = useRowSelect();
    return (
        <InputText
            id={props.id}
            value={getValue(selectedRow)}
            style={{...props.layoutStyle}} 
            onChange={change => {editRow(change.target.value, props.columnName)}}/>
    )

    function getValue(row){
        if(row[props.columnName]){
            return row[props.columnName]
        } else if(props.initialValue) {
            return props.initialValue[props.columnName]
        }
    }
}






