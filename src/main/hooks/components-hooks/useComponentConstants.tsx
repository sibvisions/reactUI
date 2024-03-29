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

import { CSSProperties, useContext } from "react";
import useProperties from "../data-hooks/useProperties";
import useLayoutValue from "../style-hooks/useLayoutValue";
import useComponentStyle from "../style-hooks/useComponentStyle";
import { AppContextType, appContext } from "../../contexts/AppProvider";
import IBaseComponent from "../../util/types/IBaseComponent";
import useStyleClassNames from "./useStyleClassNames";

/**
 * Returns the component constants which almost every component uses
 * @param baseProps - the baseproperties a component receives from the server
 * @param fb - the fallback value for styles
 */
const useComponentConstants = <T extends IBaseComponent> (baseProps:T, fb?:CSSProperties):
[AppContextType, [T], CSSProperties|undefined, CSSProperties, string[]] => {
    /** Returns utility variables */
    const context = useContext(appContext);

    /** Up to date properties for the component */
    const [props] = useProperties<T>(baseProps.id, {...baseProps});

    /** get the layout style value, if there is no parent and no popup use root keyword to get all available space */
    const layoutStyle = useLayoutValue(props.parent || context.contentStore.isPopup(props as any) ? props.id : "root", fb);

    /** get the component style of the component */
    const compStyle = useComponentStyle(props);

    /** get the classnames */
    const styleClassNames = useStyleClassNames(props.style)

    return [context, [props], layoutStyle, compStyle, styleClassNames];
}
export default useComponentConstants