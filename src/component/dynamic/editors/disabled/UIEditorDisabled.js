import React, { useContext, useEffect } from 'react';
import { InputText } from "primereact/inputtext";
import { getPreferredSize } from '../../../helper/GetSizes';
import { RefContext } from '../../../helper/Context';

function UIEditorDisabled(props) {
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
        <InputText
            disabled={true}
            id={props.id}
            contentEditable="false"
            style={{...props.layoutStyle, background: props.background}}
        />
    );
}
export default UIEditorDisabled;