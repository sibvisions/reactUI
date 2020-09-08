import React, { useContext, useEffect, useRef, useLayoutEffect } from 'react';

import {Checkbox} from 'primereact/checkbox';
import { RefContext } from '../../helper/Context';
import { getPreferredSize } from '../../helper/GetSizes';
import { buttonProps, styleButton, styleChildren } from '../buttons/ButtonStyling';
import { toPx } from '../../helper/ToPx';


function UICheckBox(props) {
    const btnData = buttonProps(props)
    const con = useContext(RefContext)
    const btnRef = useRef();

    useEffect(() => {
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props), 
                id: props.id, 
                parent: props.parent
            }
        );
    })

    useLayoutEffect(() => {
        styleButton(btnRef.current, btnRef.current.children[0], props.constraints);
        styleChildren(btnRef.current.children[0].children, props, btnData);
    })

    return (
        <div ref={btnRef} style={props.layoutStyle}>
            <span id={props.id} style={btnData.btnProps.style}>
                <Checkbox
                    inputId={props.id}
                    style={{order: btnData.btnProps.iconPos === 'left' ? '1' : '2'}}
                    onChange={() => {
                        let checked = props.selected === undefined ? true : !props.selected
                        con.serverComm.setValue(props.name, checked);
                    }}
                    checked={props.selected}
                />
                <label className="p-chkbox-label" htmlFor={props.id} style={{order: btnData.btnProps.iconPos === 'left' ? '2' : '1'}}>
                    {btnData.iconProps.icon !== null &&
                        <i className={btnData.iconProps.icon} style={{height: toPx(btnData.iconProps.size.height), width: toPx(btnData.iconProps.size.width), color: btnData.iconProps.color, marginRight: '4px'}}/>
                    }
                    {props.text}
                </label>
            </span>
        </div>
    )
}
export default UICheckBox;