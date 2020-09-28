import React, { useContext, useState } from 'react';
import "./UIEditorChoice.scss"
import { RefContext } from '../../../helper/Context';
import { getAlignments } from '../../ComponentProperties';
import { getPreferredSize } from '../../../helper/GetSizes';
import { sendSetValues } from '../../../helper/SendSetValues';

function UIEditorChoice(props) {
    const con = useContext(RefContext);
    const alignments = getAlignments(props);
    const allowedValues = con.contentStore.metaData.get(props.dataRow).columns.get(props.columnName).cellEditor.allowedValues
    const [currValue, setCurrValue] = useState(allowedValues.indexOf(con.contentStore.storedData.get(props.dataRow)[con.contentStore.selectedRow.get(props.dataRow)][props.columnName]))

    function handleClick() {
        let newIndex = currValue;
        if (allowedValues[newIndex+1] === undefined) {
            newIndex = 0;
        }
        else {
            newIndex++
        }
        setCurrValue(newIndex)
        sendSetValues(con, props.rowId, props.dataRow, props.name, props.columnName, allowedValues[newIndex])
    }

    function sendSize() {
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
            <button className="choice-editor" onClick={handleClick}>
                <img 
                    id={props.id} alt="yo" 
                    style={{cursor: 'pointer'}} 
                    onLoad={sendSize} 
                    src={'http://localhost:8080/JVx.mobile/services/mobile/resource/demo' + props.cellEditor.imageNames[currValue]}
                />
            </button>
        </span>
    )
}
export default UIEditorChoice