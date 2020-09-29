import {useContext, useEffect, useState} from "react";
import {jvxContext} from "../../jvxProvider";
import BaseComponent from "../BaseComponent";

const useProperties = <F extends BaseComponent>(id: string) => {
    const context = useContext(jvxContext);
    const [props, setProps] = useState<F>((context.contentStore.flatContent.get(id) as F));

    useEffect(() => {
        context.contentStore.subscribeToProperties(id, (newProp: F) => {
            setProps(newProp)
        });
        return () => {
            context.contentStore.unsubscribeFromProperties(id);
        }
    });
    return [props];
}
export default useProperties;