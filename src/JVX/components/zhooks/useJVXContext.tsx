/** React imports */
import { useContext } from "react"

/** Other imports */
import { jvxContext } from "../../jvxProvider"

/** This hook returns the jvxContext to library users */
const useJVXContext = () => {
    const context = useContext(jvxContext);
    return context;
}
export default useJVXContext;