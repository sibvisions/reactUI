import React, { useState, useContext, useEffect, useLayoutEffect, useRef } from 'react';
import BaseButton from '../BaseButton';
import { RefContext } from '../../../helper/Context';
import { getPreferredSize } from '../../../helper/GetSizes';
import { RadioButton } from 'primereact/radiobutton';
import { styleButton, styleChildren, buttonProps } from '../ButtonStyling';

function UIRadioButton(props) {
    const [checked, setChecked] = useState(props.selected ? true : false)
    const btnRef = useRef();
    const con = useContext(RefContext);
    const btnData = buttonProps(props);

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
    });

    return (
        <div ref={btnRef} style={props.layoutStyle}>
            <span id={btnData.btnProps.id} style={btnData.btnProps.style} tabIndex={btnData.btnProps.tabIndex}>
                <RadioButton
                    value={props.id}
                    inputId={props.id}
                    style={{order: btnData.btnProps.iconPos === 'left' ? '1' : '2'}}
                    checked={checked}
                    onChange={() => {
                        setChecked(!checked)
                        con.serverComm.pressButton(props.name)
                    }}
                />
                <label className="p-radiobutton-label" htmlFor={btnData.btnProps.id} style={{order: btnData.btnProps.iconPos === 'left' ? '2' : '1'}}>
                    {props.text}
                </label>
            </span>
        </div>
    );
}
export default UIRadioButton