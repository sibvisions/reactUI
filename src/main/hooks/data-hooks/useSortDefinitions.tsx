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

import { useContext, useState, useEffect } from "react"
import { appContext } from "../../contexts/AppProvider";
import { SortDefinition } from "../../request/data/SortRequest";

/**
 * Returns the sort-definitions for the dataprovider of a screen
 * @param screenName - the name of a screen
 * @param dataProvider - the dataprovider
 * @returns 
 */
const useSortDefinitions = (screenName:string, dataProvider:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** The current state of the sortDefinitions for the dataprovider */
    const [sortDefinitions, setSortDefinitions] = useState<SortDefinition[]|undefined>(context.contentStore.getDataBook(screenName, dataProvider)?.sortedColumns);

    /**
     * Subscribes to sort-definitions which updates the value of sortDefinitions
     * @returns unsubscribes from sort-definitions
     */
    useEffect(() => {
        context.subscriptions.subscribeToSortDefinitions(screenName, dataProvider, () => setSortDefinitions(context.contentStore.getDataBook(screenName, dataProvider)?.sortedColumns));

        return () => context.subscriptions.unsubscribeFromSortDefinitions(screenName, dataProvider, () => setSortDefinitions(context.contentStore.getDataBook(screenName, dataProvider)?.sortedColumns));
    }, [context.subscriptions, screenName, dataProvider]);

    return [sortDefinitions]
}
export default useSortDefinitions;