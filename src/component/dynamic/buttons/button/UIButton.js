import React, { useContext, useRef, useEffect, useLayoutEffect } from 'react';
import './UIButton.scss'
import { Button } from "primereact/button";
import { RefContext } from '../../../helper/Context';
import { getPreferredSize } from '../../../helper/GetSizes';
import { buttonProps, styleButton, styleChildren, addHoverEffect } from '../ButtonStyling'

function UIButton(props) {
    const con = useContext(RefContext);
    const btnRef = useRef();
    const btnData = buttonProps(props)

    useEffect(() => {
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props),
                id: props.id,
                parent: props.parent
            }
        );
        
        let btnDiv = btnRef.current;
        window.addEventListener("resize", () => {
            if (btnDiv !== null) {
                styleButton(btnDiv, btnDiv.children[0], props.constraints);
            }
        });

        return () => {
            window.removeEventListener("resize", () => {
                if (btnDiv !== null) {
                    styleButton(btnDiv, btnDiv.children[0], props.constraints);
                }
            });
        }
    }, [con, props]);

    useLayoutEffect(() => {
        styleButton(btnRef.current, btnRef.current.children[0], props.constraints);
        styleChildren(btnRef.current.children[0].children, props, btnData);
        addHoverEffect(btnRef.current.children[0], btnData.btnProps.style.background, null, 5, props, btnData.btnBorderPainted, null)
    })

    return (
        <div ref={btnRef} style={props.layoutStyle}>
            <Button 
                {...btnData.btnProps}
                label={props.text}
                icon={btnData.iconProps ? btnData.iconProps.icon : null}
                onClick={() => con.serverComm.pressButton(props.name)}/>
        </div>
    );
}
export default UIButton