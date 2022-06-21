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
import useProperties from "../data-hooks/useProperties";
import useLayoutValue from "../style-hooks/useLayoutValue";
import useConstants from "../components-hooks/useConstants";
import useComponentStyle from "../style-hooks/useComponentStyle";
import { AppContextType } from "../../contexts/AppProvider";
import BaseComponent from "../../util/types/BaseComponent";
import { TopBarContextType } from "../../components/topbar/TopBar";

/**
 * Returns the component constants which almost every component uses
 * @param baseProps - the baseproperties a component receives from the server
 * @param fb - the fallback value for styles
 */
const useComponentConstants = <T extends BaseComponent> (baseProps:T, fb?:CSSProperties):
[AppContextType, TopBarContextType, [T], CSSProperties|undefined, Map<string, string>, CSSProperties] => {
    /** Returns utility variables */
    const [context, topbar, translations] = useConstants();

    /** Up to date properties for the component */
    const [props] = useProperties<T>(baseProps.id, {...baseProps});

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.parent ? props.id : "root", fb);

    /** get the component style of the component */
    const compStyle = useComponentStyle(props);

    return [context, topbar, [props], layoutStyle, translations, compStyle];
}
export default useComponentConstants