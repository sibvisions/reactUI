import { useContext } from "react";
import { appContext } from "../../AppProvider";

/** This hook gives users access to the api functions */
const useAPI = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    return context.api
}
export default useAPI;