import React, {FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {SplitButton} from "primereact/splitbutton";
import tinycolor from 'tinycolor2';
import {createPressButtonRequest} from "../../../factories/RequestFactory";
import {jvxContext} from "../../../jvxProvider";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import {IButton} from "../IButton";
import {addHoverEffect, buttonProps, renderButtonIcon} from "../ButtonStyling";
import { parseIconData } from "../../compprops/ComponentProperties";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import BaseComponent from "../../BaseComponent";
import { parseJVxSize } from "../../util/parseJVxSize";

export interface IMenuButton extends IButton {
    popupMenu: string;
}

const UIMenuButton: FC<IMenuButton> = (baseProps) => {

    const buttonWrapperRef = useRef<HTMLSpanElement>(null);
    const buttonRef = useRef<any>(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IMenuButton>(baseProps.id, baseProps);
    const btnData = useMemo(() => buttonProps(props), [props]);
    const [items, setItems] = useState<Array<any>>();
    const {onLoadCallback, id} = baseProps;
    const btnJustify = btnData.style.justifyContent || "center";
    const btnAlign = btnData.style.alignItems || "center";

    useEffect(() => {
        const buildMenu = (foundItems:Map<string, BaseComponent>) => {
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
        if (buttonRef.current) {
            const btnRef = buttonRef.current
            let bgdColor = btnData.style.background as string || window.getComputedStyle(document.documentElement).getPropertyValue('--btnDefaultBgd');
            btnRef.defaultButton.style.setProperty('justify-content', btnJustify);
            btnRef.defaultButton.style.setProperty('align-items', btnAlign);
            btnRef.defaultButton.style.setProperty('padding', btnData.style.padding)
            if (btnData.iconProps.icon)
                renderButtonIcon(btnRef.defaultButton.children[0], props, btnData.iconProps, context.server.RESOURCE_URL);
            (btnData.btnBorderPainted && tinycolor(bgdColor).isDark()) ? btnRef.container.classList.add("bright") : btnRef.container.classList.add("dark");
            addHoverEffect(btnRef.container as HTMLElement, props.borderOnMouseEntered, bgdColor, null, 5, btnData.btnBorderPainted, undefined, props.background ? true : false);
        }

    },[props, btnData.btnBorderPainted, btnData.iconProps, btnData.style, context.server.RESOURCE_URL])

    useLayoutEffect(() => {
        const btnRef = buttonWrapperRef.current;
        if (btnRef) {
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), btnRef, onLoadCallback)
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);
    
    return (
        <span ref={buttonWrapperRef} style={{position: 'absolute', ...layoutValue.get(props.id)}}>
            <SplitButton
                ref={buttonRef}
                className={"rc-popupmenubutton"  + (props.borderPainted === false ? " border-notpainted" : "")}
                style={{...btnData.style, padding: '0'}}
                label={props.text}
                icon={btnData.iconProps ? btnData.iconProps.icon : undefined}
                tabIndex={btnData.tabIndex}
                model={items}
                //@ts-ignore
                onClick={() => buttonRef.current.show()} />
        </span>
    )
}
export default UIMenuButton