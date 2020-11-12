import React, {FC, useContext, useLayoutEffect, useRef, useState} from "react";
import './UIEditorCheckbox.scss'
import {Checkbox} from 'primereact/checkbox';
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";
import {jvxContext} from "../../../jvxProvider";
import {sendSetValues} from "../../util/SendSetValues";
import { checkCellEditorAlignments } from "../../compprops/CheckAlignments";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";

interface ICellEditorCheckbox extends ICellEditor{
    text?: string,
    selectedValue?:string|boolean|number|undefined, 
    preferredEditorMode?: number
}

export interface IEditorCheckbox extends IEditor{
    cellEditor: ICellEditorCheckbox
}

const UIEditorCheckbox: FC<IEditorCheckbox> = (baseProps) => {

    const cbxRef = useRef(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IEditorCheckbox>(baseProps.id, baseProps)
    const [selectedRow] = useRowSelect(props.dataRow, props.columnName);
    const alignments = checkCellEditorAlignments(props);

    const getCbxType = (selectedValue:string|boolean|number|undefined) => {
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

    const getBooleanValue = (input:string|boolean|number|undefined) => {
        if (input === 'Y' || input === true || input === 1) {
            return true;
        }
        else {
            return false;
        }
    }

    const getColumnValue = (curr:boolean, type:string) => {
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

    const cbxType = getCbxType(props.cellEditor.selectedValue)
    const [checked, setChecked] = useState(getBooleanValue(selectedRow))
    const {onLoadCallback, id} = baseProps;

    useLayoutEffect(() => {
        if(onLoadCallback && cbxRef.current){
            sendOnLoadCallback(id, props.preferredSize, cbxRef.current, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize]);

    return (
        <span
            ref={cbxRef}
            className="jvxEditorCheckbox"
            style={{
                ...layoutValue.get(props.id) || baseProps.editorStyle,
                backgroundColor: props.cellEditor_background_,
                justifyContent: alignments?.ha,
                alignItems: alignments?.va
            }}>
            <Checkbox
                inputId={id}
                checked={checked}
                onChange={() => {
                    setChecked(!checked)
                    sendSetValues(props.dataRow, props.name, props.columnName, getColumnValue(getBooleanValue(checked), cbxType), undefined, context.server)
                }} 
            />
            <label className="jvxEditorCheckbox-label" htmlFor={id}>{props.cellEditor?.text}</label>
        </span>
    )
}
export default UIEditorCheckbox