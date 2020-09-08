import React, { useState, useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { ToggleButton } from 'primereact/togglebutton';
import { RefContext } from '../../../helper/Context';
import tinycolor from 'tinycolor2';
import { getPreferredSize } from '../../../helper/GetSizes';
import { buttonProps, styleButton, styleChildren, addHoverEffect } from '../ButtonStyling';

function UIToggleButton(props) {
    const [checked, setChecked] = useState();
    const con = useContext(RefContext);
    const btnRef = useRef();
    const btnData = buttonProps(props);
    const [bgd, setBgd] = useState(btnData.btnProps.style.background);
    const btnBgdChecked = props.background !== undefined ? tinycolor(props.background).darken(5) : tinycolor("#007ad9").darken(10);

    useEffect(() => {
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props),
                id: props.id,
                parent: props.parent
            }
        );
    }, [con, props]);

    useLayoutEffect(() => {
        styleButton(btnRef.current, btnRef.current.children[0], props.constraints);
        styleChildren(btnRef.current.children[0].children, props, btnData);
        addHoverEffect(btnRef.current.children[0], btnData.btnProps.style.background, btnBgdChecked, 5, props, btnData.btnBorderPainted, checked);
    });

    return (
        <div ref={btnRef} style={props.layoutStyle}>
            <ToggleButton
                {...btnData.btnProps}
                offLabel={props.text}
                onLabel={props.text}
                offIcon={btnData.iconProps.icon}
                onIcon={btnData.iconProps.icon}
                checked={checked}
                style={{...btnData.btnProps.style, background: bgd, borderColor: bgd}}
                onChange={e => {
                    setChecked(e.value);
                    setBgd(e.value ? btnBgdChecked : btnData.btnProps.style.background)
                }}/>
        </div>
    )
}
export default UIToggleButton