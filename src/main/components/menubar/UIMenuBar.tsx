import React, { FC, useMemo } from "react";
import COMPONENT_CLASSNAMES_V2 from "../COMPONENT_CLASSNAMES_V2";
import { useComponents, useConstants, useMenuItems, useProperties } from "../zhooks";

const UIMenuBar: FC<any> = (baseProps) => {
    const [context, topbar, translations] = useConstants();

    const [props] = useProperties<any>(baseProps.id, baseProps);

    const [children, components] = useComponents(props.id, props.className);

    const menuChildren = useMemo(() => children.filter(component => component.className === COMPONENT_CLASSNAMES_V2.MENU).map(menu => menu.id), [children]);

    const menuItems = useMenuItems(menuChildren);

    console.log(menuChildren)

    return (
        <div>test</div>
    )
}
export default UIMenuBar