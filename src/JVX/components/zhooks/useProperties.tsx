/** React imports */
import {useContext, useEffect, useState} from "react";

/** Other imports */
import BaseComponent from "../BaseComponent";
import {jvxContext} from "../../jvxProvider";

/**
 * This hook returns the up to date properties for a component
 * @param id - the id of the component
 * @param init - the initial properties sent by the server
 */
const useProperties = <T extends BaseComponent>(id: string, init: T) : [T] => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Current state of the properties */
    const [props, setProps] = useState<T>(init);

    /**
     * Subscribes to propChange which will set the state of the current properties for the component
     * @returns unsubscribes from propChange
     */
    useEffect(() => {
        context.contentStore.subscribeToPropChange(id, (value: T) => {
            setProps({...value});
        });
        return() => {
           context.contentStore.unsubscribeFromPropChange(id);
        };
    }, [id, context.contentStore, props]);

    return [props]
}
export default useProperties