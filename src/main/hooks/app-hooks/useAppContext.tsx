import { useContext } from "react"
import { appContext } from "../../AppProvider"

/** This hook returns the appContext to library users */
const useAppContext = () => {
    const context = useContext(appContext);
    return context;
}
export default useAppContext;