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

/**
 * Returns the increment to add to a navigation when there are multiple screens with the same navigation-name
 * @param navName - the navigation-name of a screen
 * @param map - the navigation-name-map
 */
export function getNavigationIncrement(navName: string, map:Map<string, { screenId: string, componentId: string }>) {
    let increment: number | string = 0;
    for (let key of map.keys()) {
        if (key.replace(/\s\d+$/, '') === navName)
            increment++
    }
    if (increment === 0 || (increment === 1 && map.has(navName))) {
        increment = '';
    }
    return increment
}