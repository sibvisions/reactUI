import React, { useState, useContext, useEffect, useLayoutEffect } from 'react';
import { RefContext } from '../../../helper/Context';
import { getPreferredSize } from '../../../helper/GetSizes';
import { getPanelBgdColor } from '../../ComponentProperties';
import useCompStartUp from '../../../hooks/useCompStartUp';
import { insertLayout } from '../../../helper/InsertLayout';

function UIGroupPanel(props) {
    const [bgdColor, setBgdColor] = useState();
    const content = useCompStartUp(props);
    const con = useContext(RefContext)

    useEffect(() => {
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props),
                id: props.id,
                parent: props.parent
            }
        )
    }, [props, con]);

    useLayoutEffect(() => {
        setBgdColor(getPanelBgdColor(props, con));
    }, [props, con]);

    return (
        <fieldset id={props.id} style={{height: '100%', background: bgdColor, paddingInlineStart: '0', paddingInlineEnd: '0', paddingBlockStart: '0', paddingBlockEnd: '0', ...props.layoutStyle}}>
            <legend>{props.text}</legend>
                {insertLayout(content, props)}
        </fieldset>
    );
}
export default UIGroupPanel;