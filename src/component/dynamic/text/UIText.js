import React, { useState, useEffect, useContext } from 'react';
import { RefContext } from '../../helper/Context';
import { InputText } from 'primereact/inputtext';
import { getPreferredSize } from '../../helper/GetSizes';

function UIText(props) {
    const [txtValue, setTextValue] = useState();
    const con = useContext(RefContext);

    useEffect(() => {
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props), 
                id: props.id, 
                parent: props.parent
            }
        );
    }, [con, props]);

    return (
        <InputText id={props.id} value={txtValue || ''} style={props.layoutStyle} onChange={change => setTextValue(change.target.value)}/>
    )
}
export default UIText