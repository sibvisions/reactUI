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
import { appContext } from "../../AppProvider";
import { createFetchRequest } from "../../factories/RequestFactory";
import { REQUEST_KEYWORDS } from "../../request";
import { showTopBar, TopBarContext } from "../../components/topbar/TopBar";

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
    }, []);
}
export default useFetchMissingData