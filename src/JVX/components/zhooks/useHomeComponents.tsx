import React, {ReactElement, useCallback, useContext, useEffect, useState} from "react"
import Settings from "../../../frontmask/settings/Settings";
import { jvxContext } from "../../jvxProvider";

const useHomeComponents = (componentId:string) => {
    const context = useContext(jvxContext);

    const buildWindow = useCallback((compId:string):Array<ReactElement> => {
        let compKey = "";
        let tempArray: Array<ReactElement> = [];
        if (compId === "settings") {
            tempArray.push(<Settings/>)
        }
        for (let [key, value] of context.contentStore.navigationNames.entries()) {
            if (value === compId)
            compKey = key
        }
        if (context.contentStore.getWindow(compKey))
        tempArray.push(context.contentStore.getWindow(compKey));
        return tempArray
    },[context.contentStore])

    const [homeChildren, setHomeChildren] = useState<Array<ReactElement>>(buildWindow(componentId));

    useEffect(() => {
        if (componentId)
            setHomeChildren(buildWindow(componentId))
    },[buildWindow, componentId])

    useEffect(() => {
        const buildHomeChildren = (compKey:string) => {
            const newHomeChildren = buildWindow(compKey);
            const cl = new Array<ReactElement>();
            homeChildren.forEach(hc => {
                cl.push(hc);
            });
            newHomeChildren.forEach(nHc => {
                cl.push(nHc);
            });
            setHomeChildren(cl);
        }
        context.contentStore.subscribeToPopupChange((compKey:string) => {
            buildHomeChildren(compKey)
        });

        return () => {
            context.contentStore.unsubscribeFromPopupChange(buildHomeChildren)
        }
    },[context.contentStore, buildWindow, homeChildren])

    return homeChildren
}
export default useHomeComponents