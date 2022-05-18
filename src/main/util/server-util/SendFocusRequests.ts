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

import { createFocusGainedRequest, createFocusLostRequest } from "../../factories/RequestFactory";
import { REQUEST_KEYWORDS } from "../../request";
import Server from "../../server/Server";
import ServerV2 from "../../server/ServerV2";

/**
 * Sends a focus-gained-request to the server
 * @param componentId - the component id to focus
 * @param server - the server-class to send the request
 */
export function onFocusGained(componentId: string, server: Server|ServerV2) {
    const focusGainedReq = createFocusGainedRequest();
    focusGainedReq.componentId = componentId;
    return server.sendRequest(focusGainedReq, REQUEST_KEYWORDS.FOCUS_GAINED, undefined, undefined, true);
}

/**
 * Sends a focus-lost-request to the server
 * @param componentId - the component id to focus
 * @param server - the server-class to send the request
 */
export function onFocusLost(componentId: string, server: Server|ServerV2) {
    const focusLostReq = createFocusLostRequest();
    focusLostReq.componentId = componentId;
    return server.sendRequest(focusLostReq, REQUEST_KEYWORDS.FOCUS_LOST, undefined, undefined, true);
}