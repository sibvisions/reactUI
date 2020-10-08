import React, { useContext, useRef } from 'react';
import "./UIEditorChoice.scss"
import { RefContext } from '../../../helper/Context';
import { getAlignments } from '../../ComponentProperties';
import { getPreferredSize } from '../../../helper/GetSizes';
import { sendSetValues } from '../../../helper/SendSetValues';
import { toPx } from '../../../helper/ToPx';
import useRowSelect from '../../../hooks/useRowSelect';
import { mergeObject } from '../../../helper/MergeObject';

function UIEditorChoice(props) {
    const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue !== undefined ? props.initialValue : "", props.id, props.dataRow, props.cellEditor.className);
    const con = useContext(RefContext);
    const btnRef = useRef();
    const alignments = getAlignments(props);
    const allowedValues = con.contentStore.metaData.get(props.dataRow).columns.get(props.columnName).cellEditor.allowedValues;
    const images = con.contentStore.metaData.get(props.dataRow).columns.get(props.columnName).cellEditor.images;
    const mergedValImg = mergeObject(allowedValues, images)

    function handleClick() {
        let newIndex = allowedValues.indexOf(selectedColumn);
        if (allowedValues[newIndex+1] === undefined) {
            newIndex = 0;
        }
        else {
            newIndex++
        }
        editColumn(allowedValues[newIndex])
        console.log(props.rowId)
        sendSetValues(con, props.rowId, props.dataRow, props.name, props.columnName, allowedValues[newIndex])
    }

    function sendSize() {
        btnRef.current.style.height = toPx(btnRef.current.children[0].offsetHeight);
        btnRef.current.style.width = toPx(btnRef.current.children[0].offsetWidth);
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props),
                id: props.id,
                parent: props.parent
            }
        );
    }

    return (
        <span style={{ ...props.layoutStyle, display: 'inline-flex', justifyContent: alignments.ha, alignItems: alignments.va }}>
            <button ref={btnRef} className="choice-editor" onClick={handleClick}>
                <img 
                    id={props.id} 
                    alt="yo" 
                    style={{cursor: 'pointer'}} 
                    onLoad={sendSize} 
                    src={mergedValImg[selectedColumn] ? 'http://localhost:8080/JVx.mobile/services/mobile/resource/demo' + mergedValImg[selectedColumn] : ""}
                />
            </button>
        </span>
    )
}
export default UIEditorChoice