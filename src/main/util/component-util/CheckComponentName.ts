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
 * Checks if the component-name starts with a number, if it does, it adds an "_" before the name.
 * Returns the name adjusted if it starts with a number and default if it doesn't need to be changed.
 * @param name - the name of the component
 */
export function checkComponentName(name:string) {
    let checkedName = name;
    if (name.match(/^\d/)) {
        checkedName = "_" + name;
    }

    if (name.includes(".")) {
        checkedName = name.replaceAll(".", "");
    }

    return checkedName;
}