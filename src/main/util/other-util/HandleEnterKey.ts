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

import { getFocusComponent } from "../html-util/GetFocusComponent";

/**
 * When enter is pressed call the given setValues function to send new values to the server
 * @param event - the event that fired
 * @param elem - the element that fired the event
 * @param name - the name of the component
 * @param stopEditing - a function to stop cell-editing
 */
export function handleEnterKey(event:any, elem:any, name:string, stopEditing?:Function) {
    if (event.key === "Enter") {
        event.preventDefault();
        elem.blur();
        if (stopEditing) {
            stopEditing(event);
        }
        else {
            if (event.shiftKey) {
                getFocusComponent(name, false)?.focus();
            }
            else {
                getFocusComponent(name, true)?.focus();
            }
        }
    }
    else if (stopEditing) {
        stopEditing(null); // forces focus on table
    }
}