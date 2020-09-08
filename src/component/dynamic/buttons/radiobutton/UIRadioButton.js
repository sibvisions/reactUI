import React, { useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { RefContext } from '../../../helper/Context';
import { getPreferredSize } from '../../../helper/GetSizes';
import { RadioButton } from 'primereact/radiobutton';
import { styleButton, styleChildren, buttonProps } from '../ButtonStyling';
import { toPx } from '../../../helper/ToPx';

function UIRadioButton(props) {
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
            <span id={props.id} style={btnData.btnProps.style}>
                <RadioButton
                    value={props.id}
                    inputId={props.id}
                    style={{order: btnData.btnProps.iconPos === 'left' ? '1' : '2'}}
                    checked={props.selected}
                    onChange={() => {
                        let checked = props.selected === undefined ? true : !props.selected
                        con.serverComm.setValue(props.name, checked)
                    }}
                />
                <label className="p-radiobutton-label" htmlFor={props.id} style={{order: btnData.btnProps.iconPos === 'left' ? '2' : '1'}}>
                    {btnData.iconProps.icon !== null &&
                        <i className={btnData.iconProps.icon} style={{height: toPx(btnData.iconProps.size.height), width: toPx(btnData.iconProps.size.width), color: btnData.iconProps.color, marginRight: '4px'}}/>
                    }
                    {props.text}
                </label>
            </span>
        </div>
    );
}
export default UIRadioButton