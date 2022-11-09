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

import { useContext, useLayoutEffect } from "react";
import { appContext } from "../../contexts/AppProvider";
import { createFetchRequest } from "../../factories/RequestFactory";
import { showTopBar, TopBarContext } from "../../components/topbar/TopBar";
import REQUEST_KEYWORDS from "../../request/REQUEST_KEYWORDS";

/**
 * Fetches the missing dataprovider if it isn't in the contentstore
 * @param screenName - the name of the screen
 * @param dataProvider - the dataprovider to fetch
 */
const useFetchMissingData = (screenName:string, dataProvider:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    // Checks if the dataProvider already exists in the contentstore, if no a fetchrequest is created
    // Then if the dataprovider has been already been pushed into an array, it is not fetched to prevent multiple fetches
    // If it isn't already added, it is then added and a fetch request is sent
    useLayoutEffect(() => {
        if (dataProvider && !context.contentStore.getDataBook(screenName, dataProvider)?.data) {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = dataProvider;
            if (!context.contentStore.getDataBook(screenName, dataProvider)?.metaData) {
                fetchReq.includeMetaData = true;
            }

            if (!context.server.missingDataFetches.includes(dataProvider)) {
                context.server.missingDataFetches.push(dataProvider);
                showTopBar(context.server.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH), topbar)
            }
        }
    }, [dataProvider]);
}
export default useFetchMissingData