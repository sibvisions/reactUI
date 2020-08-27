import useRowSelect from "../../../hooks/useRowSelect";
import React, { useRef, useEffect, useContext } from 'react';
import { InputNumber } from "primereact/inputnumber";
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';
import { getHooksPreferredSize } from "../../../helper/GetPreferredSize";
import { RefContext } from "../../../helper/Context";

function UIEditorNumberHooks(props) {
    const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue, props.id);
    const inputRef = useRef();
    const con = useContext(RefContext);


    useEffect(() => {
        if(inputRef.current.inputEl){
            const alignments = checkCellEditorAlignments(props);
            inputRef.current.inputEl.style['background-color'] = props['cellEditor.background'];
            inputRef.current.inputEl.style['text-align'] = alignments.ha;
        }
        con.contentStore.emitSizeCalculated({size: getHooksPreferredSize(props), id: props.id, parent: props.parent, firstTime: true});
    });

    return(
        <InputNumber
            id={props.id}
            ref={inputRef}
            useGrouping={false}
            value={selectedColumn}
            style={props.layoutStyle}
            onChange={changeEvent => editColumn(changeEvent.target.value)}
            disabled={!props["cellEditor.editable"]}
        />
    )
}
export default UIEditorNumberHooks