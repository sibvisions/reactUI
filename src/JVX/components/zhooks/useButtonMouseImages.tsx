import {useContext, useCallback, useRef, useEffect} from "react"
import { jvxContext } from "../../jvxProvider";
import IconProps from "../compprops/IconProps";
import useEventHandler from "./useEventHandler";

const isFAIcon = (iconName?:string) => {
    return iconName?.includes('fa fa-');
}

const removeIcon = (elem:HTMLElement, iconName:string) => {
    if (isFAIcon(iconName)) {
        elem.classList.remove(iconName.substring(3));
    } else {
        elem.style.setProperty('--iconImage', '');
    }
}

const useButtonMouseImages = (iconData?:IconProps, mousePressedIconData?:IconProps, mouseOverIconData?:IconProps, btnElement?:HTMLElement) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);

    const containsIcon = useCallback((elem:HTMLElement, iconName:string) => {
        return elem.classList.contains(iconName.substring(3)) || 
            window.getComputedStyle(elem).getPropertyValue('--iconImage') === `url(${context.server.RESOURCE_URL + iconName})`
    }, [context.server.RESOURCE_URL]);

    const addIcon = useCallback((elem:HTMLElement, iconName:string) => {
        if (isFAIcon(iconName)) {
            elem.classList.add(iconName.substring(3));
        } else {
            elem.style.setProperty('--iconImage', `url(${context.server.RESOURCE_URL + iconName})`);
        }
    }, [context.server.RESOURCE_URL]);

    const iconElement = btnElement?.children[0] as HTMLElement;

    const handleMouseImagePressed = useCallback(() => {
        if (mouseOverIconData?.icon && containsIcon(iconElement, mouseOverIconData.icon)) {
            removeIcon(iconElement, mouseOverIconData.icon)
        } else if (containsIcon(iconElement, iconData!.icon!)) {
            removeIcon(iconElement, iconData!.icon!)
        }
        addIcon(iconElement, mousePressedIconData!.icon!)
    }, [iconElement, iconData?.icon, mouseOverIconData?.icon, mousePressedIconData?.icon]);

    const handleMouseImageReleased = useCallback(() => {
        removeIcon(iconElement, mousePressedIconData!.icon!);
        if (mouseOverIconData?.icon) {
            addIcon(iconElement, mouseOverIconData.icon);
        } else {
            addIcon(iconElement, iconData!.icon!);
        }
    }, [iconElement, iconData?.icon, mouseOverIconData?.icon, mousePressedIconData?.icon]);

    const handleMouseImageOver = useCallback(() => {
        removeIcon(iconElement, iconData!.icon!);
        addIcon(iconElement, mouseOverIconData!.icon!)
    }, [iconElement, iconData?.icon, mouseOverIconData?.icon])

    const handleMouseImageOut = useCallback(() => {
        if (mousePressedIconData?.icon && containsIcon(iconElement, mousePressedIconData.icon)) {
            removeIcon(iconElement, mousePressedIconData.icon);
        } else if (mouseOverIconData?.icon) {
            removeIcon(iconElement, mouseOverIconData?.icon)
        }
        addIcon(iconElement, iconData!.icon!)
    }, [iconElement, iconData?.icon, mouseOverIconData?.icon, mousePressedIconData?.icon]);


    useEventHandler(btnElement, 'mousedown', iconData?.icon && mousePressedIconData?.icon ? handleMouseImagePressed : undefined);
    useEventHandler(btnElement, 'mouseup', iconData?.icon && mousePressedIconData?.icon ? handleMouseImageReleased : undefined);
    useEventHandler(btnElement, 'mouseenter', iconData?.icon && mouseOverIconData?.icon ? handleMouseImageOver : undefined);
    useEventHandler(btnElement, 'mouseleave', iconData?.icon && (mousePressedIconData?.icon || mouseOverIconData?.icon) ? handleMouseImageOut : undefined);
}
export default useButtonMouseImages