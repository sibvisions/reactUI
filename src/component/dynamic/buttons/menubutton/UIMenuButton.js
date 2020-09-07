import React, { useContext, useRef, useEffect, useLayoutEffect, useState } from 'react';
import { RefContext } from '../../../helper/Context';
import './UIMenuButton.scss'
import { SplitButton } from "primereact/splitbutton";
import { getPreferredSize } from '../../../helper/GetSizes';
import { parseIconData } from '../../ComponentProperties';
import { styleButton, styleChildren, addHoverEffect, buttonProps } from '../ButtonStyling';

function UIMenuButton(props) {
    const [items, setItems] = useState();
    const con = useContext(RefContext);
    const btnRef = useRef();
    const menuRef = useRef();
    const btnData = buttonProps(props);

    useEffect(() => {
        const buildMenu = foundItems => {
            let tempItems = [];
            foundItems.forEach(item => {
                let iconProps = parseIconData(item.props, item.image);
                tempItems.push({
                    label: item.text,
                    icon: iconProps ? iconProps.icon : null,
                    id: item.id,
                    className: item.id,
                    style: {
                        color: iconProps.color
                    },
                    color: iconProps.color,
                    command: () => con.serverComm.pressButton(item.name)
                });
            });
            setItems(tempItems);
        };
        buildMenu(con.contentStore.flatContent.filter(item => item.parent === props.popupMenu));

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
                styleChildren(btnDiv.children[0].children, props, btnData);
            }
        });

        return () => {
            window.removeEventListener("resize", () => {
                if (btnDiv !== null) {
                    styleButton(btnDiv, btnDiv.children[0], props.constraints);
                    styleChildren(btnDiv.children[0].children, props, btnData);
                }
            });
        }
    // eslint-disable-next-line
    }, [con, props]);

    useLayoutEffect(() => {
        styleButton(btnRef.current, btnRef.current.children[0], props.constraints);
        styleChildren(btnRef.current.children[0].children, props, btnData);
        addHoverEffect(btnRef.current.children[0].children[0], btnData.btnProps.style.background, null, 5, props, btnData.btnBorderPainted, null);
        addHoverEffect(btnRef.current.children[0].children[1], btnData.btnProps.style.background, null, 5, props, btnData.btnBorderPainted, null);
    });

    const onMainButtonClicked = () => {
        menuRef.current.show()
    }

    return (
        <div ref={btnRef} style={props.layoutStyle}>
            <SplitButton
                id={btnData.btnProps.id}
                ref={menuRef}
                label={props.text}
                style={{background: btnData.btnProps.style.background, borderColor: btnData.btnProps.style.borderColor, borderRadius: '3px'}}
                icon={btnData.iconProps ? btnData.iconProps.icon : null}
                onClick={() => onMainButtonClicked()}
                model={items}
                tabIndex={btnData.btnProps.tabIndex}
            />
        </div>
    );
}

export default UIMenuButton