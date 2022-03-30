import { useContext, useEffect, useState } from "react";
import BaseComponent from "../../util/types/BaseComponent";
import { appContext } from "../../AppProvider";

/**
 * This hook returns the up to date properties for a component
 * @param id - the id of the component
 * @param init - the initial properties sent by the server
 */
const useProperties = <T extends BaseComponent>(id: string, init: T) : [T] => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Current state of the properties */
    const [props, setProps] = useState<T>(init);

    /**
     * Subscribes to propChange which will set the state of the current properties for the component
     * @returns unsubscribes from propChange
     */
    useEffect(() => {
        context.subscriptions.subscribeToPropChange(id, (value: T) => {
            setProps({...value});
        });
        return() => {
           context.subscriptions.unsubscribeFromPropChange(id);
        };
    }, [id, context.subscriptions, props]);

    return [props]
}
export default useProperties