/** React imports */
import React, { FC, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";

/** 3rd Party imports */
import { Checkbox } from 'primereact/checkbox';

/** Hook imports */
import { useProperties, useRowSelect } from "../../zhooks";

/** Other imports */
import { ICellEditor, IEditor } from "..";
import { LayoutContext } from "../../../LayoutContext";
import { appContext } from "../../../AppProvider";
import { getEditorCompId, sendSetValues, sendOnLoadCallback, parsePrefSize, parseMinSize, parseMaxSize } from "../../util";
import { getAlignments } from "../../compprops";

/** Interface for cellEditor property of CheckBoxCellEditor */
export interface ICellEditorCheckBox extends ICellEditor {
    text?: string,
    selectedValue?:string|boolean|number|undefined, 
}

/** Interface for CheckBoxCellEditor */
export interface IEditorCheckBox extends IEditor {
    cellEditor: ICellEditorCheckBox
}

/**
 * Returns the boolean value depending on the CheckBox input
 * @param input - value of CheckBoxCellEditor
 * @returns boolean value of CheckBox input
 */
export function getBooleanValue(input: string | boolean | number | undefined) {
    if (input === 'Y' || input === true || input === 1) {
        return true;
    }
    else {
        return false;
    }
}

/**
 * The CheckBoxCellEditor displays a CheckBox and its label and edits its value in its databook
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIEditorCheckBox: FC<IEditorCheckBox> = (baseProps) => {
    /** Reference for the span that is wrapping the button containing layout information */
    const cbxRef = useRef(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IEditorCheckBox>(baseProps.id, baseProps)
    /** ComponentId of the screen */
    const compId = getEditorCompId(props.id, context.contentStore);
    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);
    /** Alignments for CellEditor */
    const alignments = getAlignments(props);

    /**
     * Returns the CheckBox Type based on the selectedValue. The value of a checkbox can be:
     * string, number and boolean
     * @param selectedValue - the selected value
     * @returns the CheckBox Type, string, number or boolean 
     */
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

    /**
     * Returns the correct value which needs to be sent to the server based on the CheckBoxCellEditor type.
     * @param value - current CheckBox value 
     * @param type - CheckBoxCellEditor type
     * @returns the correct value for CheckBox type to send to server
     */
    const getColumnValue = (value:boolean, type:string) => {
        if (value) {
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

    /** The CheckBox type */
    const cbxType = getCbxType(props.cellEditor.selectedValue)
    /** Current state of wether the CheckBox is currently checked or not */
    const [checked, setChecked] = useState(getBooleanValue(selectedRow))
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && cbxRef.current){
            sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), cbxRef.current, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    useEffect(() => {
        setChecked(getBooleanValue(selectedRow))
    }, [selectedRow]);

    const handleOnChange = () => {
        setChecked(prevState => !prevState);
        sendSetValues(props.dataRow, props.name, props.columnName, getColumnValue(checked, cbxType), context.server)
    }

    useEffect(() => {
        if (baseProps.id === "") {
            handleOnChange()
        }
    }, []);

    return (
        <span
            ref={cbxRef}
            className="rc-editor-checkbox"
            style={{
                ...layoutValue.get(props.id) || baseProps.editorStyle,
                backgroundColor: props.cellEditor_background_,
                justifyContent: alignments?.ha,
                alignItems: alignments?.va
            }}>
            <Checkbox
                inputId={id}
                checked={checked}
                onChange={() => handleOnChange()} 
            />
            {baseProps.id !== "" &&
                <label className="rc-editor-checkbox-label" htmlFor={id}>{props.cellEditor?.text}</label>
            }
            
        </span>
    )
}
export default UIEditorCheckBox