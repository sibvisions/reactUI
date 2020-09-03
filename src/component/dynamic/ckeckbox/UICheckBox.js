import React, { useContext, useEffect } from 'react';

import {Checkbox} from 'primereact/checkbox';
import { RefContext } from '../../helper/Context';
import { getPreferredSize } from '../../helper/GetSizes';


function UICheckBox(props) {
    const con = useContext(RefContext)

    useEffect(() => {
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props), 
                id: props.id, 
                parent: props.parent
            }
        );
    })

    return (
        <Checkbox id={props.id} onChange={() => {
            let checked = props.selected === undefined ? true : !props.selected
            con.serverComm.setValue(props.name, checked);
        }}
            style={props.layoutStyle}
            checked={props.selected} />
    )
}
export default UICheckBox;