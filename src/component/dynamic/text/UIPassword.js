import React, { useState, useEffect, useContext } from 'react';
import { RefContext } from '../../helper/Context';
import { getPreferredSize } from '../../helper/GetSizes';
import {Password} from 'primereact/password';

function UIPassword(props) {
    const [pwValue, setPwValue] = useState();
    const con = useContext(RefContext);

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
        <Password 
            id={props.id} 
            value={pwValue || ''}
            feedback={false}
            style={props.layoutStyle} 
            onChange={change => setPwValue(change.target.value)}
        />
    )
}
export default UIPassword