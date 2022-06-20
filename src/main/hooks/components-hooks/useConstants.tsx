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

import { useContext } from "react"
import useTranslation from "../app-hooks/useTranslation";
import { appContext, AppContextType } from "../../AppProvider"
import { TopBarContext, TopBarContextType } from "../../components/topbar/TopBar";

/**
 * This hook returns the constants which are most used by other components
 */
const useConstants = ():[AppContextType, TopBarContextType, Map<string, string>] => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of translations */
    const translations = useTranslation();

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    return [context, topbar, translations]
}
export default useConstants