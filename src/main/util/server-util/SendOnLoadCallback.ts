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

import { CSSProperties } from "react";
import COMPONENT_CLASSNAMES from "../../components/COMPONENT_CLASSNAMES";
import CELLEDITOR_CLASSNAMES from "../../components/editors/CELLEDITOR_CLASSNAMES";
import { removeLayoutStyle } from "../component-util/RemoveLayoutStyle";
import Dimension from "../types/Dimension";
//import { CELLEDITOR_CLASSNAMES } from "../../components/editors";

/**
 * Checks if the preferred size isn't to small or to big for its minimum/maximum size
 * @param prefSize - the preferred size
 * @param minSize - the minimum size
 * @param maxSize - the maximum size
 * @returns the preferred size adjusted to minimum/maximum size if necessary
 */
export function checkSizes(prefSize:Dimension, minSize:Dimension|undefined, maxSize:Dimension|undefined):Dimension {
    let sizeToSend:Dimension = prefSize;
    if (minSize) {
        if (prefSize.width < minSize.width) {
            sizeToSend.width = minSize.width;
        }
            
        if (prefSize.height < minSize.height) {
            sizeToSend.height = minSize.height;
        }
            
    }
    if (maxSize) {
        if (maxSize.width < prefSize.width) {
            sizeToSend.width = maxSize.width;
        }
            
        if (maxSize.height < prefSize.height) {
            sizeToSend.height = maxSize.height
        }
    }
    return sizeToSend
}

/**
 * Returns the maximum of a refs offsetWidth, scrollWidth, or boundingClientRect.width of a ref
 * @param ref - the element of a component
 * @param className - the classname of a component
 */
function measurePrefWidth(ref: any, className: string) {
    const arrString: string[] = [COMPONENT_CLASSNAMES.TEXTAREA, COMPONENT_CLASSNAMES.TEXTFIELD, COMPONENT_CLASSNAMES.PASSWORD, CELLEDITOR_CLASSNAMES.TEXT, COMPONENT_CLASSNAMES.SPLITPANEL] as string[];
    if (arrString.indexOf(className) !== -1) {
        return Math.max(ref.offsetWidth, Math.ceil(ref.getBoundingClientRect().width))
    }
    else {
        if (className === COMPONENT_CLASSNAMES.LABEL) {
            if (ref && !(ref.parentElement as HTMLElement).classList.contains('rc-label-html')) {
                // +1 for labels which are not html labels because the text overflow ellipsis (...) could cause the label to be cut off. (HTML labels do not have that)
                return Math.max(ref.offsetWidth + 1, ref.scrollWidth + 1, Math.ceil(ref.getBoundingClientRect().width) + 1)
            }
        }
        return Math.max(ref.offsetWidth, ref.scrollWidth, Math.ceil(ref.getBoundingClientRect().width))
    }
}

/**
 * Sends the onload callback of the component to the layout
 * @param id - the id of the component
 * @param preferredSize - the preferred size
 * @param maxSize - the maximum size
 * @param minSize - the minimum size
 * @param element - the reference of the component
 * @param onLoadCallback - the onLoadCallback function
 */
export function sendOnLoadCallback(id: string, className:string, preferredSize:Dimension|undefined, maxSize: Dimension|undefined, minSize: Dimension|undefined, element: any, onLoadCallback: Function | undefined) {
    let checkedSize:Dimension
    if (onLoadCallback) {
        if (preferredSize) {
            checkedSize = checkSizes(preferredSize, minSize, maxSize);
            onLoadCallback(id, checkedSize, minSize, maxSize);
        }
        else { 
            if (element) {
                let prefSize:Dimension;
                let oldStyle: CSSProperties = {}; 
                let styleEl = element;
                if (className !== COMPONENT_CLASSNAMES.LABEL && className !== COMPONENT_CLASSNAMES.SPLITPANEL) {
                    if (element.getAttribute("layoutstyle-wrapper")) {
                        styleEl = document.getElementById(element.getAttribute("layoutstyle-wrapper"));
                    }
                    oldStyle = removeLayoutStyle(styleEl);
                }
                /** Measure how big the component wants to be initially */
                prefSize = {width: measurePrefWidth(element, className), height: Math.max(element.offsetHeight, Math.ceil(element.getBoundingClientRect().height))};
                checkedSize = checkSizes(prefSize, minSize, maxSize);
                onLoadCallback(id, checkedSize, minSize, maxSize);
                styleEl.style.top = oldStyle.top;
                styleEl.style.left = oldStyle.left;
                styleEl.style.width = oldStyle.width;
                styleEl.style.height = oldStyle.height;
            }
        }
    }
}