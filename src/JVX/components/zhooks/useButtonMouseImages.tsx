import {useContext, useLayoutEffect} from "react"
import { jvxContext } from "../../jvxProvider";
import IconProps from "../compprops/IconProps";

const useButtonMouseImages = (iconData?:IconProps, mousePressedIconData?:IconProps, mouseOverIconData?:IconProps, btnElement?:any) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);

    useLayoutEffect(() => {
        const isFAIcon = (iconName?:string) => {
            return iconName?.includes('fa fa-');
        }

        const containsIcon = (elem:HTMLElement, iconName:string) => {
            return elem.classList.contains(iconName.substring(3)) || window.getComputedStyle(btnElement).getPropertyValue('--iconImage') === 'url(' + context.server.RESOURCE_URL + iconName + ')'
        }

        const removeIcon = (elem:HTMLElement, iconName:string) => {
            if (isFAIcon(iconName)) {
                elem.classList.remove(iconName.substring(3));
            }
            else {
                elem.style.setProperty('--iconImage', '');
            }
        }

        const addIcon = (elem:HTMLElement, iconName:string) => {
            if (isFAIcon(iconName)) {
                elem.classList.add(iconName.substring(3));
            }
            else {
                elem.style.setProperty('--iconImage', 'url(' + context.server.RESOURCE_URL + iconName + ')');
            }
        }

        const handleMouseImagePressed = (elem:HTMLElement) => {
            if (mouseOverIconData?.icon && containsIcon(elem, mouseOverIconData.icon)) {
                removeIcon(elem, mouseOverIconData.icon)
            }
            else if (containsIcon(elem, iconData!.icon!)) {
                removeIcon(elem, iconData!.icon!)
            }
            addIcon(elem, mousePressedIconData!.icon!)
        }

        const handleMouseImageReleased = (elem:HTMLElement) => {
            removeIcon(elem, mousePressedIconData!.icon!);
            if (mouseOverIconData?.icon) {
                addIcon(elem, mouseOverIconData.icon);
            }
            else {
                addIcon(elem, iconData!.icon!);
            }
        }

        const handleMouseImageOver = (elem:HTMLElement) => {
            removeIcon(elem, iconData!.icon!);
            addIcon(elem, mouseOverIconData!.icon!)
        }

        const handleMouseImageOut = (elem:HTMLElement) => {
            if (mousePressedIconData?.icon && containsIcon(elem, mousePressedIconData.icon)) {
                removeIcon(elem, mousePressedIconData.icon);
            }
            else if (mouseOverIconData?.icon) {
                removeIcon(elem, mouseOverIconData?.icon)
            }
            addIcon(elem, iconData!.icon!)
        }

        if (btnElement && iconData?.icon) {
            const iconElement = btnElement.children[0] as HTMLElement;

            if (mousePressedIconData?.icon) {
                btnElement.addEventListener('mousedown', () => handleMouseImagePressed(iconElement));
                btnElement.addEventListener('mouseup', () => handleMouseImageReleased(iconElement));
            }

            if (mouseOverIconData?.icon) {
                btnElement.addEventListener('mouseover', () => handleMouseImageOver(iconElement));
            }

            if (mousePressedIconData?.icon || mouseOverIconData?.icon) {
                btnElement.addEventListener('mouseout', () => handleMouseImageOut(iconElement));
            }
        }

        return () => {
            if (btnElement && iconData?.icon) {
                const iconElement = btnElement.children[0] as HTMLElement;

                if (mousePressedIconData?.icon) {
                    btnElement.removeEventListener('mousedown', () => handleMouseImagePressed(iconElement));
                    btnElement.removeEventListener('mouseup', () => handleMouseImageReleased(iconElement));
                }

                if (mouseOverIconData?.icon) {
                    btnElement.removeEventListener('mouseover', () => handleMouseImageOver(iconElement));
                }

                if (mousePressedIconData?.icon || mouseOverIconData?.icon) {
                    btnElement.removeEventListener('mouseout', () => handleMouseImageOut(iconElement));
                }
            }
        }
    },[btnElement, context.server])
}
export default useButtonMouseImages