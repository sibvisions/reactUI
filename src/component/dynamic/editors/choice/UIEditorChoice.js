import React, { useEffect, useContext } from 'react';
import "./UIEditorChoice.scss"
import { RefContext } from '../../../helper/Context';
//import useRowSelect from '../../../hooks/useRowSelect';
import { getAlignments } from '../../ComponentProperties';
import { Size } from '../../../helper/Size';

function UIEditorChoice(props) {
    //const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue || "", props.id)
    const con = useContext(RefContext);
    const alignments = getAlignments(props)


    useEffect(() => {
        con.contentStore.emitSizeCalculated(
            {
                size: new Size(16, 16),
                id: props.id,
                parent: props.parent
            }
        );
    }, [con, props]);

    function handleClick() {
        console.log('yo')
    }

    return(
        <span id={props.id} style={{...props.layoutStyle, display: 'flex', justifyContent: alignments.ha, alignItems: alignments.va}}>
            <button className="choice-editor" onClick={handleClick}>
                <img alt="yo" src={'http://localhost:8080/JVx.mobile/services/mobile/resource/demo' + props.cellEditor.defaultImageName}></img>
            </button>
        </span>
    )
}
export default UIEditorChoice