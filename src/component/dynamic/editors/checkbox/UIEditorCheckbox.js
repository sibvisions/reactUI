import React, { useContext, useEffect, useState } from 'react';
import {Checkbox} from 'primereact/checkbox';
import { getPreferredSize } from '../../../helper/GetSizes';
import { RefContext } from '../../../helper/Context';
import { getAlignments } from '../../ComponentProperties';

function UIEditorCheckbox(props) {
    const [checked, setChecked] = useState(props.selected ? true : false)
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

    return (
        <span id={props.id} style={{
            ...props.layoutStyle,
            display: "inline-flex",
            background: props["cellEditor.background"],
            justifyContent: alignments.ha,
            alignContent: alignments.va
        }}>
            <Checkbox inputId={props.id} onChange={e => setChecked(e.checked)} checked={checked} disabled={!props["cellEditor.editable"]} />
            <label htmlFor={props.id}>{props.cellEditor.text}</label>
        </span>
    )
}
export default UIEditorCheckbox;