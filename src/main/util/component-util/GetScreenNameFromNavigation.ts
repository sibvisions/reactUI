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

import BaseContentStore from "../../contentstore/BaseContentStore";

/**
 * Returns the screenId from the navigation-name
 * @param navigationName - the navigation name of the screen
 * @param contentStore - the content-store
 * @returns the screenId from the navigation-name
 */
export function getScreenIdFromNavigation(navigationName:string, contentStore:BaseContentStore) {
    let screenId:string = navigationName;
    for (let [key, value] of contentStore.navigationNames.entries()) {
        if (key === navigationName) {
            screenId = value.screenId
        }
    }
    return screenId
}