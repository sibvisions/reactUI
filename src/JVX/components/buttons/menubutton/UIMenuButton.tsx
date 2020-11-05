import React, {FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import './UIMenuButton.scss';
import {SplitButton} from "primereact/splitbutton";
import {createPressButtonRequest} from "../../../factories/RequestFactory";
import {jvxContext} from "../../../jvxProvider";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import {IButton} from "../IButton";
import {addHoverEffect, buttonProps, styleButton} from "../ButtonStyling";
import { parseIconData } from "../../compprops/ComponentProperties";

export interface IMenuButton extends IButton {
    popupMenu: string;
}

const UIMenuButton: FC<IMenuButton> = (baseProps) => {

    const buttonRef = useRef<HTMLSpanElement>(null);
    const menuRef = useRef(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IMenuButton>(baseProps.id, baseProps);
    const btnData = useMemo(() => buttonProps(props), [props]);
    const [items, setItems] = useState<Array<any>>();
    const {onLoadCallback, id} = baseProps;

    useEffect(() => {
        const buildMenu = (foundItems:Array<any>) => {
            let tempItems:Array<any> = [];
            foundItems.forEach(item => {
                let iconProps = parseIconData(props.foreground, item.image);
                tempItems.push({
                    label: item.text,
                    icon: iconProps ? iconProps.icon : undefined,
                    style: {
                        color: iconProps.color
                    },
                    color: iconProps.color,
                    command: () => {
                        const req = createPressButtonRequest();
                        req.componentId = item.name;
                        context.server.sendRequest(req, REQUEST_ENDPOINTS.PRESS_BUTTON);
                    }
                });
            });
            setItems(tempItems);
        }
        buildMenu(context.contentStore.getChildren(props.popupMenu));
    },[context.contentStore, context.server, props])

    useLayoutEffect(() => {
        const btnRef = buttonRef.current;
        let bgdColor = btnData.style.backgroundColor;
        if (btnRef) {
            styleButton(btnRef.children[0].children, props.className, props.horizontalTextPosition, props.verticalTextPosition, props.imageTextGap, btnData.style, btnData.iconProps, context.server.RESOURCE_URL);
            if (!bgdColor)
                bgdColor = window.getComputedStyle(btnRef.children[0]).getPropertyValue('background-color');
            addHoverEffect(btnRef.children[0] as HTMLElement, props.className, props.borderOnMouseEntered, bgdColor, null, 5, btnData.btnBorderPainted, undefined, props.background ? true : false);
        }
    },[btnData.btnBorderPainted, 
        btnData.iconProps, btnData.style, context.server.RESOURCE_URL,
        props.className, props.horizontalTextPosition, props.imageTextGap, props.background,
        props.style, props.verticalTextPosition, id, props.borderOnMouseEntered, layoutValue])

    useLayoutEffect(() => {
        const btnRef = buttonRef.current;
        if (btnRef) {
            if (onLoadCallback) {
                const size: DOMRect = btnRef.getBoundingClientRect();
                onLoadCallback(id, size.height, size.width);
            }
        }
    }, [onLoadCallback, id]);

    return (
        <span ref={buttonRef} style={{position: 'absolute', ...layoutValue.get(props.id)}}>
            <SplitButton
                ref={menuRef}
                className={"jvxPopupMenuButton"  + (props.borderPainted === false ? " borderNotPainted" : "")}
                style={{...btnData.style, borderRadius: '3px'}}
                label={props.text}
                icon={btnData.iconProps ? btnData.iconProps.icon : undefined}
                tabIndex={btnData.tabIndex as string}
                model={items}
                //@ts-ignore
                onClick={() => menuRef.current.show()} />
        </span>
    )
}
export default UIMenuButton