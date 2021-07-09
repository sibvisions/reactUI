/** React imports */
import { useContext } from "react";
/** Other imports */
import { appContext } from "../../AppProvider";

const useAPI = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    return context.api
}
export default useAPI;