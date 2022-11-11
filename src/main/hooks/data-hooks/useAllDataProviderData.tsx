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
import { appContext } from "../../contexts/AppProvider";
import { getScreensData } from "../../util/data-util/GetDataProvidersOfComp";

/**
 * This hook returns the current data of all dataproviders of a component as Map
 * @param screenName - the name of the screen
 * @param dataBooks - the databooks of the component
 * @returns the current data of all dataproviders of a component as Map
 */
const useAllDataProviderData = (screenName:string, dataBooks?:string[]): Map<string, any> => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Current state of dataMap */
    const [dataMap, setDataMap] = useState<Map<string, any>>(getScreensData(context.contentStore.getScreenDataproviderMap(screenName), dataBooks));

    /**
     * Subscribes to screenDataChange
     * @returns unsubscribes from screenDataChange
     */
    useEffect(() => {
        /** sets the state */
        const onScreenDataChange = () => {
            const a = getScreensData(context.contentStore.getScreenDataproviderMap(screenName), dataBooks)
            setDataMap(new Map(a));
        }

        context.subscriptions.subscribeToScreenDataChange(screenName, onScreenDataChange);
        return () => context.subscriptions.unsubscribeFromScreenDataChange(screenName);
    },[context.contentStore, context.subscriptions, screenName, dataBooks]);

    return dataMap
}
export default useAllDataProviderData;