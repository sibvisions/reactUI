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

import { CSSProperties, useLayoutEffect } from "react";
import { removeLayoutStyle } from "../../util/component-util/RemoveLayoutStyle";
import LoadCallBack from "../../util/types/LoadCallBack";
import useAddLayoutStyle from "./useAddLayoutStyle";

/**
 * This hook clones an element, removes the layoutstyle and remeasures itself, then reports its size again when the designer updates the component.
 * Also sets the layoutstyle to an element
 * @param designerUpdate - the flag if the designer updated a component
 * @param ref - the element to clone and measure
 * @param layoutStyle - the layoutstyle to set
 * @param loadCallBack - the size report function
 * @param loadCallBackFunc - the original loadback function received in 'usecomponents'
 */
const useHandleDesignerUpdate = (designerUpdate:boolean|undefined, ref: any, layoutStyle: CSSProperties|undefined, loadCallBack:Function, loadCallBackFunc:LoadCallBack|undefined, additionalDependency?: any, labelRef?: any) => {
    useLayoutEffect(() => {
        if (ref && designerUpdate !== undefined) {
            const cloneElem = ref.cloneNode(true) as HTMLElement;
            cloneElem.style.visibility = "hidden";
            ref.after(cloneElem)
            removeLayoutStyle(cloneElem);
            loadCallBack(cloneElem)
            cloneElem.remove();
        }
    }, [designerUpdate])

    useAddLayoutStyle(labelRef ? labelRef : ref, layoutStyle, loadCallBackFunc, additionalDependency)
}
export default useHandleDesignerUpdate