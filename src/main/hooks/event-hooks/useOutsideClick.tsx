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
import { LengthBasedColumnDescription, NumericColumnDescription } from "../../response/data/MetaDataResponse";

/**
 * This hook adds a clickListener to the document, when a LinkedCellEditor or a DateCellEditor is opened while in-cell editing,
 *  to check if there was a click outside of the given ref.
 * @param ref - The reference which will be checked
 * @param setEdit - a function to set the state of edit in in-cell editing
 * @param metaData - metaData of cell
 * @returns removes clickListener
 */
const useOutsideClick = (ref: any, setEdit: Function, metaData: NumericColumnDescription|LengthBasedColumnDescription|undefined) => {
    useEffect(() => {
        // This checks if the click was outside to stop editing or close panels
        const handleClickOutside = (event: any) => {
            if (ref.current 
                && !ref.current.contains(event.target) 
                && !event.target.classList.contains('p-autocomplete-item') 
                && !event.target.classList.contains('celleditor-dropdown-virtual-scroller') 
                && !event.target.closest(".p-datepicker")
                && !event.target.closest(".celleditor-dropdown-virtual-scroller")) {
                if (metaData?.cellEditor.contentType?.includes("multiline") || metaData?.cellEditor.contentType?.includes("singleline")) {
                    ref.current.children[0].blur();
                }
                else {
                    ref.current.children[0].children[0].blur();
                }
                setEdit();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [ref, setEdit, metaData])
}
export default useOutsideClick