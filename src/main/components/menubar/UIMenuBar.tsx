import { Menubar } from "primereact/menubar";
import React, { FC, useEffect, useMemo, useRef } from "react";
import COMPONENT_CLASSNAMES_V2 from "../COMPONENT_CLASSNAMES_V2";
import { useComponents, useMenuItems, useProperties } from "../zhooks";

/**
 * This component displays a menubar for a frame
 * @param baseProps - the base properties received from the frame
 */
const UIMenuBar: FC<any> = (baseProps) => {
    const [props] = useProperties<any>(baseProps.id, baseProps);

    const [children] = useComponents(props.id, props.className);

    const menuRef = useRef<HTMLDivElement>(null);

    const menuChildren = useMemo(() => children.filter(component => component.className === COMPONENT_CLASSNAMES_V2.MENU).map(menu => menu.id), [children]);

    const menuItems = useMenuItems(menuChildren);

    useEffect(() => {
        if (menuRef.current) {
            baseProps.sizeCallback({ height: menuRef.current.offsetHeight, width: menuRef.current.offsetWidth});
        }
    }, [menuItems]);

    return (
        <div ref={menuRef} id={props.name}>
            <Menubar  model={menuItems} />
        </div>
    )
}
export default UIMenuBar