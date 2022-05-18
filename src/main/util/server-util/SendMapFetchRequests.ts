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

import { createFetchRequest } from "../../factories/RequestFactory";
import { REQUEST_KEYWORDS } from "../../request";

/**
 * Sends fetch requests, for the groups and points of a map, to the server
 * @param groupDataProvider - the dataprovider of the group databook
 * @param pointDataProvider - the dataprovider of the point databook
 * @param server - server context
 */
export async function sendMapFetchRequests(groupDataProvider:string, pointDataProvider:string, server:any) {
    /** Builds the fetch request */
    const sendFetchRequest = (dataProvider:string) => {
        return new Promise<void>((resolve) => {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = dataProvider;
            fetchReq.fromRow = 0;
            server.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH).then(() => resolve());
        })
    }

    if (groupDataProvider) {
        await sendFetchRequest(groupDataProvider);
    }
    
    if (pointDataProvider) {
        await sendFetchRequest(pointDataProvider);
    }
}