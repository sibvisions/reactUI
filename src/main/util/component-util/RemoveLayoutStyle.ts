/* Copyright 2023 SIB Visions GmbH
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
 * Removes the top, left, width and height of the style from an element
 * @param ref - the element to remove the style properties from
 */
export function removeLayoutStyle(ref:any) {
    if (ref) {
        ref.style.removeProperty("top");
        ref.style.removeProperty("left");
        ref.style.removeProperty("width");
        ref.style.removeProperty("height");
    }
}