/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import { useContext, useCallback } from "react"
import IconProps from "../../components/comp-props/IconProps";
import { appContext } from "../../contexts/AppProvider";
import useEventHandler from "./useEventHandler";

/**
 * Returns true if the icon is a FontAwesome icon
 * @param iconName - the name of the icon
 */
export const isFAIcon = (iconName?:string) => {
    return (iconName?.includes('fas fa-') || iconName?.includes('far fa-') || iconName?.includes('fab fa-'));
}

/**
 * Removes an icon from an element
 * @param elem - the element where the icon is removed
 * @param iconName - the name of the icon
 */
const removeIcon = (elem:HTMLElement, iconName:string) => {
    if (isFAIcon(iconName)) {
        switch (iconName.split(" ")[0]) {
            case "fas": case "far": case "fab":
                elem.classList.remove(iconName.substring(4));
                break;
            case "fa":
                elem.classList.remove(iconName.substring(3));
                break;
            default:
                elem.classList.remove(iconName.substring(4));
                break;
        }
    } 
    else {
        elem.style.setProperty('--iconImage', '');
    }
}

/**
 * Hook for buttons that listens to mouse-events to change a buttons icon
 * @param iconData - the parsed icon-data of the button
 * @param mousePressedIconData - the parsed icon-data which is shown when the mouse is pressed
 * @param mouseOverIconData - the parsed icon-data which is shown when the mouse is hovered over the button
 * @param btnElement - the element of the button
 */
const useButtonMouseImages = (iconData?:IconProps, mousePressedIconData?:IconProps, mouseOverIconData?:IconProps, btnElement?:HTMLElement) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /**
     * Checks if an element already contains an icon
     * @param elem - the element to be checked
     * @param iconName - the icon which needs to be checked
     */
    const containsIcon = useCallback((elem:HTMLElement, iconName:string) => {
        return elem.classList.contains(iconName.substring(4)) || 
            window.getComputedStyle(elem).getPropertyValue('--iconImage') === `url(${context.server.RESOURCE_URL + iconName})`
    }, [context.server.RESOURCE_URL]);

    /**
     * Adds an icon to the element
     * @param elem - the element the icon is added to
     * @param iconName - the icon which is added
     */
    const addIcon = useCallback((elem:HTMLElement, iconName:string) => {
        if (isFAIcon(iconName)) {
            switch (iconName.split(" ")[0]) {
                case "fas": case "far": case "fab":
                    elem.classList.add(iconName.substring(4));
                    break;
                case "fa":
                    elem.classList.add(iconName.substring(3));
                    break;
                default:
                    elem.classList.add(iconName.substring(4));
                    break;
            }
        } 
        else {
            elem.style.setProperty('--iconImage', `url(${context.server.RESOURCE_URL + iconName})`);
        }
    }, [context.server.RESOURCE_URL]);

    /** The element of the icon */
    const iconElement = btnElement?.children[0] as HTMLElement;

    // Adds the mouse-pressed icon to the element
    const handleMouseImagePressed = useCallback(() => {
        if (mouseOverIconData?.icon && containsIcon(iconElement, mouseOverIconData.icon)) {
            removeIcon(iconElement, mouseOverIconData.icon)
        } 
        else if (containsIcon(iconElement, iconData!.icon!)) {
            removeIcon(iconElement, iconData!.icon!)
        }
        addIcon(iconElement, mousePressedIconData!.icon!)
    }, [iconElement, iconData?.icon, mouseOverIconData?.icon, mousePressedIconData?.icon]);

    // Changes the icon back to the standard when mouse is released
    const handleMouseImageReleased = useCallback(() => {
        removeIcon(iconElement, mousePressedIconData!.icon!);
        if (mouseOverIconData?.icon) {
            addIcon(iconElement, mouseOverIconData.icon);
        } 
        else {
            addIcon(iconElement, iconData!.icon!);
        }
    }, [iconElement, iconData?.icon, mouseOverIconData?.icon, mousePressedIconData?.icon]);

    // Changes the icon when mouse is hovering
    const handleMouseImageOver = useCallback(() => {
        removeIcon(iconElement, iconData!.icon!);
        addIcon(iconElement, mouseOverIconData!.icon!)
    }, [iconElement, iconData?.icon, mouseOverIconData?.icon])

    // Changes icon back when stop hovering
    const handleMouseImageOut = useCallback(() => {
        if (mousePressedIconData?.icon && containsIcon(iconElement, mousePressedIconData.icon)) {
            removeIcon(iconElement, mousePressedIconData.icon);
        } 
        else if (mouseOverIconData?.icon) {
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