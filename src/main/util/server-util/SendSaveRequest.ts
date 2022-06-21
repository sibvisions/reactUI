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

import { createDALSaveRequest } from "../../factories/RequestFactory";
import REQUEST_KEYWORDS from "../../request/REQUEST_KEYWORDS";
import Server from "../../server/Server";
import ServerV2 from "../../server/ServerV2";

/**
 * Sends a saveRequest to the server
 * @param dataProvider - the dataprovider
 * @param onlySelected - onlyselected
 * @param server - server instance
 */
export function sendSaveRequest(dataProvider:string, onlySelected:boolean, server:Server|ServerV2) {
    const req = createDALSaveRequest();
    req.dataProvider = dataProvider;
    req.onlySelected = onlySelected;
    return server.sendRequest(req, REQUEST_KEYWORDS.DAL_SAVE);
}