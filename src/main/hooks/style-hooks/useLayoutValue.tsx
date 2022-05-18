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

import { CSSProperties, useContext } from "react"
import { LayoutContext } from "../../LayoutContext"

const check = ['left', 'top', 'width', 'height'];

/**
 * Returns the layoutStyle of a component, the parent sets for it or the fallback
 * @param id - the id of the component
 * @param fallback - the fallback style
 */
export const useLayoutValue = (id: string, fallback?: CSSProperties): CSSProperties | undefined => {
    const layoutData = useContext(LayoutContext);
    fallback = fallback || { position: 'fixed', visibility: 'hidden' };
    const mout = layoutData.has(id) ? layoutData.get(id) : fallback;
    const out = check.some(k => {
        const v = (mout as any)[k];
        return v !== undefined && isNaN(v);
    }) ? fallback : mout;
    return out;
}

export default useLayoutValue;