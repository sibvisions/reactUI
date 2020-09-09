import React, { useState, useEffect, useContext } from 'react';
import "./UIEditorChoice.scss"
import { RefContext } from '../../../helper/Context';
import useRowSelect from '../../../hooks/useRowSelect';
import { getPreferredSize } from '../../../helper/GetSizes';
import { getAlignments } from '../../ComponentProperties';

function UIEditorChoice(props) {
    const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue || "", props.id)
    const con = useContext(RefContext);
    //const alignments = getAlignments(props)


    useEffect(() => {
        console.log(getPreferredSize(props))
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props),
                id: props.id,
                parent: props.parent
            }
        );
    }, [con, props]);

    return(
        <span style={props.layoutStyle}>
            <button className="choice-editor">
                <img id={props.id} alt="yo" src={'http://localhost:8080/JVx.mobile/services/mobile/resource/demo' + props.cellEditor.defaultImageName}></img>
            </button>
        </span>
    )
}
export default UIEditorChoice