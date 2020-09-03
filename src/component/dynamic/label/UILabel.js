import React, { useEffect, useContext } from 'react';
import { getPreferredSize } from '../../helper/GetSizes';
import { RefContext } from '../../helper/Context';
import { getMargins, getAlignments, getFont } from '../ComponentProperties';

function UILabel(props) {
    const con = useContext(RefContext);
    const lblMargins = getMargins(props);
    const lblAlignments = getAlignments(props);
    const lblFont = getFont(props);
    const lblBackground = props.background;
    const lblColor = props.foreground;

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
            display: 'inline-flex',
            justifyContent: lblAlignments.ha,
            alignContent: lblAlignments.va,
            background: lblBackground,
            color: lblColor,
            fontFamily: lblFont.fontFamily,
            fontWeight: lblFont.fontWeight,
            fontStyle: lblFont.fontStyle,
            fontSize: lblFont.fontSize,
            paddingTop: lblMargins.marginTop,
            paddingLeft: lblMargins.marginLeft,
            paddingBottom: lblMargins.marginBottom,
            paddingRight: lblMargins.marginRight,
            ...props.layoutStyle
        }}>{props.text}</span>
    );
}
export default UILabel;