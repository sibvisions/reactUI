/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *]
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import { useContext, useEffect, useState } from "react";
import { appContext } from "../../contexts/AppProvider";
import { getScreenSelectedRows } from "../../util/data-util/GetDataProvidersOfComp";

/**
 * This hook returns every currently selected Row of all dataproviders of a component as Map
 * @param screenName - the name of the screen
 * @param dataBooks - the databooks of the component
 * @returns  every currently selected Row of all dataproviders of a component as Map
 */
const useAllRowSelect = (screenName:string, dataBooks?:string[]) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of dataMap */
    const [selectedRowMap, setSelectedRowMap] = useState(getScreenSelectedRows(context.contentStore.getScreenDataproviderMap(screenName), dataBooks));

    // Subscribes to ScreenRowChange
    useEffect(() => {
        const onScreenSelectedRowChange = () => {
            const a = getScreenSelectedRows(context.contentStore.getScreenDataproviderMap(screenName), dataBooks);
            setSelectedRowMap(new Map(a));
        }

        context.subscriptions.subscribeToScreenRowChange(screenName, onScreenSelectedRowChange);
        return () => context.subscriptions.unsubscribeFromScreenRowChange(screenName);
    }, [context.contentStore, context.subscriptions, screenName, dataBooks]);

    return selectedRowMap;
}
export default useAllRowSelect;