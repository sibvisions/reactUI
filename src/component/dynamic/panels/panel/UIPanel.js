import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import './UIPanel.scss';
import { RefContext } from '../../../helper/Context';
import { getPreferredSize } from '../../../helper/GetSizes';
import { getPanelBgdColor } from '../../ComponentProperties';
import useCompStartUp from '../../../hooks/useCompStartUp'
import { insertLayout } from '../../../helper/InsertLayout'

function UIPanel(props) {
    const [panelProps, setPanelProps] = useState({ bgdColor: null, overflowYVal: null });
    const content = useCompStartUp(props);
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

    useLayoutEffect(() => {
        let tempOfVal;
        if (con.contentStore.layoutMode === 'Small' || con.contentStore.layoutMode === 'Mini') {
            tempOfVal = 'auto'
        }
        setPanelProps({ bgdColor: getPanelBgdColor(props, con), overflowYVal: tempOfVal });
    }, [props, con]);

    return (
        <div id={props.id} style={{height: '100%', width: (props.parent !== undefined && !props.parent.includes("TP")) ? 'min-content' : null, background: panelProps.bgdColor, padding: '0.05px', overflowY: panelProps.overflowYVal, ...props.layoutStyle}}>
            {insertLayout(content, props)}
        </div>
    );
}
export default UIPanel;