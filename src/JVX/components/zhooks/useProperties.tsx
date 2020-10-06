import BaseComponent from "../BaseComponent";
import {useContext, useEffect, useState} from "react";
import {jvxContext} from "../../jvxProvider";

const useProperties = <T extends BaseComponent>(id: string, init: T) : [T] => {

    const context = useContext(jvxContext);
    const [props, setProps] = useState<T>(init);

    useEffect(() => {
        context.contentStore.subscribeToPropChange(id, (value: T) => {
            value.isVisible = true
            setProps({...value});
        });
        return() => {
           context.contentStore.unsubscribeFromPropChange(id);
        };
    }, [id, context.contentStore, props]);

    return [props]
}
export default useProperties