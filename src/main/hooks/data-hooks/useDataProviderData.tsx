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

/**
 * This hook returns the data of the dataprovider, it updates whenever the dataprovider gets updated
 * @param screenName - name of the screen
 * @param dataProvider - the dataprovider
 */
const useDataProviderData = (screenName:string, dataProvider:string): [any]=> {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of the data received by the dataprovider */
    const [data, setData] = useState<any>(context.contentStore.getData(screenName, dataProvider));

    /**
     * Subscribes to dataChange which will update the data state everytime the dataprovider updates
     * @returns unsubscribes from dataChange
     */
    useEffect(() => {
        /** Get the data from the dataProvider and set the state */
        const onDataChange = () => {
            const a = context.contentStore.getData(screenName, dataProvider);
            setData([...a]);
        }
        context.subscriptions.subscribeToDataChange(screenName, dataProvider, onDataChange);
        return () => context.subscriptions.unsubscribeFromDataChange(screenName, dataProvider, onDataChange);
    }, [context.subscriptions, dataProvider, screenName, context.contentStore]);

    return [data];
}
export default useDataProviderData