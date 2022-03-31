import { useEffect } from "react"
import { LengthBasedColumnDescription, NumericColumnDescription } from "../../response"

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
        const handleClickOutside = (event: any) => {
            if (ref.current 
                && !ref.current.contains(event.target) 
                && !event.target.classList.contains('p-autocomplete-item') 
                && !event.target.classList.contains('celleditor-dropdown-virtual-scroller') 
                && !event.target.closest(".p-datepicker")) {
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