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

import { AppContextType } from "../../contexts/AppProvider";
import { createFocusGainedRequest, createFocusLostRequest } from "../../factories/RequestFactory";
import REQUEST_KEYWORDS from "../../request/REQUEST_KEYWORDS";
import Server from "../../server/Server";
import ServerFull from "../../server/ServerFull";

/**
 * Sends a focus-gained-request to the server
 * @param componentId - the component id to focus
 * @param server - the server-class to send the request
 */
export function onFocusGained(name: string, server: Server|ServerFull) {
    const focusGainedReq = createFocusGainedRequest();
    focusGainedReq.componentId = name;
    return server.sendRequest(focusGainedReq, REQUEST_KEYWORDS.FOCUS_GAINED, undefined, undefined, true);
}

/**
 * Sends a focus-lost-request to the server
 * @param componentId - the component id to focus
 * @param server - the server-class to send the request
 */
export function onFocusLost(componentId: string, server: Server|ServerFull) {
    const focusLostReq = createFocusLostRequest();
    focusLostReq.componentId = componentId;
    return server.sendRequest(focusLostReq, REQUEST_KEYWORDS.FOCUS_LOST, undefined, undefined, true);
}

export function handleFocusGained(name: string, className: string, eventFocusGained: boolean|undefined, focusable: boolean|undefined, event:any, focusId:string, context: AppContextType, isCellEditor?: boolean) {
    if (isCellEditor || focusable === false) {
        if (event) {
            event.preventDefault();
        }
        return
    }
    context.contentStore.lastFocusedComponent = {id: focusId, className: className};

    if (eventFocusGained) {
        onFocusGained(name, context.server);
    }
}