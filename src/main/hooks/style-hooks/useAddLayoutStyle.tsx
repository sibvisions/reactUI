/* Copyright 2023 SIB Visions GmbH
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

import { CSSProperties, useEffect } from "react";
import LoadCallBack from "../../util/types/LoadCallBack";

/**
 * Sets the layoutStyle properties to an element, when the layoutStyle, loadBackFunc or an optional additionalDependency changes.
 * @param ref - the reference which receives the layoutStyle
 * @param layoutStyle - the layoutStyle to set
 * @param loadBackFunction - the loadBackFunction received by 'usecomponents'
 * @param additionalDependency - an optional additional dependency to trigger the useEffect
 */
const useAddLayoutStyle = (ref: any, layoutStyle: CSSProperties|undefined, loadBackFunction:LoadCallBack|undefined, additionalDependency?:any) => {
    useEffect(() => {
        if (ref && loadBackFunction) {
            ref.style.setProperty("top", layoutStyle?.top !== undefined ? `${layoutStyle.top}px`: null)
            ref.style.setProperty("left", layoutStyle?.left !== undefined ? `${layoutStyle.left}px`: null);
            ref.style.setProperty("width", layoutStyle?.width !== undefined ? `${layoutStyle.width}px`: null);
            ref.style.setProperty("height", layoutStyle?.height !== undefined ? `${layoutStyle.height}px`: null);
        }
    }, [layoutStyle, loadBackFunction, additionalDependency])
}
export default useAddLayoutStyle