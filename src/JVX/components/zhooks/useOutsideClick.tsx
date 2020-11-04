import { useEffect } from "react"

const useOutsideClick = (ref:any, setEdit:Function) => {
    useEffect(() => {
        const handleClickOutside = (event:any) => {
            if (ref.current && !ref.current.contains(event.target) && !event.target.classList.contains('p-autocomplete-item')) {
                setEdit(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    },[ref, setEdit])
}
export default useOutsideClick