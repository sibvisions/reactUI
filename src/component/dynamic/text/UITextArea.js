import React, { useState, useEffect, useContext } from 'react';
import { RefContext } from '../../helper/Context';
import { InputTextarea } from 'primereact/inputtextarea';
import { getPreferredSize } from '../../helper/GetSizes';

function UITextArea(props) {
    const [textValue, setTextValue] = useState();
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
        <InputTextarea id={props.id} value={textValue} style={{...props.layoutStyle, resize: 'none'}} onChange={change => setTextValue(change.target.value)}/>
    )
}
export default UITextArea