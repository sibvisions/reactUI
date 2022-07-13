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
 * Returns true, if the applayout is corporation, when window-width <= 530 and theme is basti mobile, it returns false because standard menu is displayed instead.
 * @param appLayout - the current layout sent by the server
 * @param theme - the current theme sent by the server
 */
 export function isCorporation(appLayout:string, theme:string) {
    if (appLayout === "corporation") {
        if (theme === "basti_mobile" && window.innerWidth <= 530) {
            return false;
        }
        return true;
    }
    return false;
}