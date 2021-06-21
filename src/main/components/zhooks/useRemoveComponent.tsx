/** React imports */
import { useContext } from "react";

/** Other imports */
import { appContext } from "../../AppProvider";

/**
 * This hook removes a component from the workscreen
 * @param compName - the component name of the component to remove
 */
const useRemoveComponent = (compName:string) => {
    const context = useContext(appContext);
    context.contentStore.registerCustomComponent(compName);
}
export default useRemoveComponent;