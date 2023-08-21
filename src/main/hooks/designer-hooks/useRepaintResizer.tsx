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
import { CSSProperties, useContext, useEffect } from "react";
import { appContext, isDesignerVisible } from "../../contexts/AppProvider";

const useRepaintResizer = (name: string, layoutStyle: CSSProperties|undefined, ref: any) => {
    const context = useContext(appContext)

    useEffect(() => {
        if (context.designer && isDesignerVisible(context.designer) && context.designer.selectedComponent && ref && ref.style && ref.style.visibility !== "hidden") {
            setTimeout(() => {
                if (context.designer && context.designer.selectedComponent && context.designer.selectedComponent.component.name === name) {
                    context.designer.paintResizer(ref.getBoundingClientRect())
                }
            }, 0)
        }
    }, [layoutStyle, context.designer]);
}
export default useRepaintResizer