import { useEffect } from "react"
import { IEditor } from "../editors/IEditor"

const useOutsideClick = (ref: any, setEdit: Function, metaData: IEditor | undefined) => {
    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (ref.current && !ref.current.contains(event.target) && !event.target.classList.contains('p-autocomplete-item') && !event.target.closest(".p-datepicker")) {
                if (metaData?.cellEditor?.className === "LinkedCellEditor" || metaData?.cellEditor?.className === "DateCellEditor") {
                    ref.current.children[0].children[0].blur();
                }
                else
                    ref.current.children[0].blur();
                setEdit(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [ref, setEdit])
}
export default useOutsideClick