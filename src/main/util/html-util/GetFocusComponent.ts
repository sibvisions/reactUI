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
 * Focuses the next or previous element based on tabindex.
 * @param id - the id of the currently focused element
 * @param next - true if the next element should be focused false if the previous
 */
export function getFocusComponent(name:string, next:boolean):HTMLElement|undefined {
    //get all focusable elements, filter out negativ tabindex/disabled/td's sort by tabindex
    let focusable = Array.from(document.getElementById("reactUI-main")!.querySelectorAll("a, button, input, select, textarea, [tabindex], [contenteditable], #" + name)).filter((e: any) => {
        if (e.disabled || (e.getAttribute("tabindex") && parseInt(e.getAttribute("tabindex")) < 0) || e.tagName === "TD") return false
        return true;
    }).sort((a: any, b: any) => {
        return (parseFloat(a.getAttribute("tabindex") || 99999) || 99999) - (parseFloat(b.getAttribute("tabindex") || 99999) || 99999);
    })
    const elemIndex = focusable.findIndex(e => e.id === name);
    const currElemIsFirst = elemIndex === 0;
    const currElemIsLast = elemIndex === focusable.length - 1;
    //if next and elem last focus first elem, if prev and elem first focus last elem
    let indexToFocus = next ? (currElemIsLast ? 0 : elemIndex + 1) : (currElemIsFirst ? focusable.length - 1 : elemIndex - 1);
    //loop if the next focusable element is a child of the current element skip it. eg. datepicker/linked overlay
    while (focusable[elemIndex] && focusable[elemIndex].contains(focusable[indexToFocus])) {
        indexToFocus++
    }
    if (focusable[indexToFocus]) {
        return (focusable[indexToFocus] as HTMLElement)
    }
    return undefined
}