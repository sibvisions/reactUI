import React, { useState, useContext, useEffect } from 'react';
import { RefContext } from '../../helper/Context';
import { parseIconData } from '../ComponentProperties';
import { getPreferredSize } from '../../helper/GetSizes';

function UIIcon(props) {
    const [icon, setIcon] = useState();
    const con = useContext(RefContext);
    const iconProps = parseIconData(props, props.image)

    useEffect(() => {
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props),
                id: props.id,
                parent: props.parent
            }
        );
    }, [props, con]);

    function iconOrImage(icon) {
        if (icon.includes('fas fa-')) {
            return <i className={icon} />
        }
        else {
            return <img alt="icon" src={'http://localhost:8080/JVx.mobile/services/mobile/resource/demo' + iconProps.icon} />
        }
    }

    return (
        <span id={props.id} style={props.layoutStyle}>
            {iconOrImage(iconProps.icon)}
        </span>
    )
}
export default UIIcon