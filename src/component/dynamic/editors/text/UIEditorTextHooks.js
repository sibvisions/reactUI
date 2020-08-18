import React, { useState }  from 'react';
import { InputText } from 'primereact/inputtext';
import useRowSelect from '../../../hooks/useRowSelect';


export function UIEditorTextHooks(props){
    const [selectedRow, editRow] = useRowSelect();
    return (
        <InputText
            id={props.id}
            value={selectedRow[props.columnName]}
            style={{...props.layoutStyle}} 
            onChange={change => {editRow(change.target.value, props.columnName)}}/>
    )
}






