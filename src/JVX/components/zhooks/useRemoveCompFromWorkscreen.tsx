/** React imports */
import {useContext} from "react";

/** Other imports */
import { jvxContext } from "../../jvxProvider";

/**
 * This hook removes a component from the workscreen
 * @param compName - the component name of the component to remove
 */
const useRemoveCompFromWorkscreen = (compName:string) => {
    const context = useContext(jvxContext);
    context.contentStore.registerCustomComponent(compName);
}
export default useRemoveCompFromWorkscreen;