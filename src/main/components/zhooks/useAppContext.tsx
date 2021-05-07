/** React imports */
import { useContext } from "react"

/** Other imports */
import { appContext } from "../../AppProvider"

/** This hook returns the appContext to library users */
const useAppContext = () => {
    const context = useContext(appContext);
    return context;
}
export default useAppContext;