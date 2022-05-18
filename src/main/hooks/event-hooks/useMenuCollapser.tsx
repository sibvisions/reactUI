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

import { useContext, useEffect, useState } from "react";
import { appContext } from "../../AppProvider";

/**
 * This hook returns the current state of the menu status, collapsed true or false
 * @param id - id to subscribe to menuCollapse
 */
const useMenuCollapser = (id:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Current state of the menu, true, if the menu is collapsed */
    const [menuCollapsed, setMenuCollapsed] = useState<boolean>(context.appSettings.menuCollapsed);

    /** 
     * Subscribes to menuCollapse 
     * @returns unsubscribe from menuCollapse
     */
    useEffect(() => {
        context.subscriptions.subscribeToMenuCollapse(id, (collapsedVal:number) => {
            /** 0 means always collapse, 1 means always expand and 2 means flipping */
            if (collapsedVal === 0) {
                setMenuCollapsed(true);
            }
            else if (collapsedVal === 1) {
                setMenuCollapsed(false);
            }
            else if (collapsedVal === 2) {
                setMenuCollapsed(prevState => !prevState);
            }
                
        });
        return () => {
            context.subscriptions.unsubscribeFromMenuCollapse(id);
        }
    }, [id, context.subscriptions, menuCollapsed]);

    return menuCollapsed;
}
export default useMenuCollapser