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

import { useEffect } from "react"
import { AppContextType } from "../../contexts/AppProvider"

/**
 * Focuses the component if they receive the "requestFocus" property.
 * @param id - the id of the component
 * @param requestFocus - the requestFocus property of the component
 * @param elem - the element to focus
 * @param context - the context to use the contentstore and subscription-manager
 */
const useRequestFocus = (id: string, requestFocus: boolean|undefined, elem: HTMLElement|undefined, context: AppContextType) => {
    /**
     * Focuses the element, sets the requestFocus property to false and notifies the component, that the property changed.
     * Server only sends requestFocus true and doesn't set it back to false so we have to do it ourselves.
     */
    useEffect(() => {
        if (requestFocus && elem && document.activeElement !== elem) {
            setTimeout(() => {
                elem.focus();
                const existingComp = context.contentStore.getComponentById(id);
                if (existingComp) {
                    existingComp.requestFocus = false;
                    context.subscriptions.propertiesSubscriber.get(id)?.apply(undefined, [existingComp]);
                }
            }, 0)
        }
    }, [requestFocus, elem])
}
export default useRequestFocus