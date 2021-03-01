/** React imports */
import {ReactElement, useCallback, useContext, useEffect, useState} from "react"

/** Other imports */
//import Settings from "../../../frontmask/settings/Settings";
import { jvxContext } from "../../jvxProvider";
import { getScreenIdFromNavigation } from "../util/GetScreenNameFromNavigation";

/**
 * This hook returns the screens which will be displayed at the "main" div multiple screens possible if popup
 * @param componentId - componentId of the screen
 */
const useHomeComponents = (componentId:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Returns the built windows */
    const buildWindow = useCallback((compId:string):Array<ReactElement> => {
        let tempArray: Array<ReactElement> = [];
        // if (compId === "settings") {
        //     tempArray.push(<Settings/>)
        // }
        if (context.contentStore.getWindow(compId))
            tempArray.push(context.contentStore.getWindow(compId));
        return tempArray
    },[context.contentStore])

    /** Current state of the built screens which will be displayed */
    const [homeChildren, setHomeChildren] = useState<Array<ReactElement>>(buildWindow(getScreenIdFromNavigation(componentId, context.contentStore)));

    /** 
     * Subscribes to popupChange which either adds a popup to the current homechildren, or removes a popup
     * @returns unsubscribing from popupChange 
     */
    useEffect(() => {
        /**
         * Adds a new window to the current homechildren e.g. a popup
         * @param compKey - componentId/navigationName of Screen
         */
        const buildHomeChildren = (compKey:string) => {
            const newHomeChildren = buildWindow(getScreenIdFromNavigation(compKey, context.contentStore));
            const cl = new Array<ReactElement>();
            homeChildren.forEach(hc => {
                cl.push(hc);
            });
            newHomeChildren.forEach(nHc => {
                cl.push(nHc);
            });
            setHomeChildren(cl);
        }

        /**
         * Removes a window from the current homechildren e.g. removing a popup
         * @param compKey - componentId/navigationName of Screen
         */
        const removeHomeChild = (compKey:string) => {
            const cl = new Array<ReactElement>();
            homeChildren.forEach(hc => {
                if (hc.props.screen_navigationName_ !== compKey)
                    cl.push(hc)
            });
            setHomeChildren(cl);
        }
        context.contentStore.subscribeToPopupChange((compKey:string, remove:boolean) => {
            if (remove)
                removeHomeChild(compKey);
            else
                buildHomeChildren(compKey);
        });

        return () => {
            context.contentStore.unsubscribeFromPopupChange((compKey:string, remove:boolean) => {
                if (remove)
                    removeHomeChild(compKey);
                else
                    buildHomeChildren(compKey);
            });
        }
    },[context.contentStore, buildWindow, homeChildren]);

    return homeChildren
}
export default useHomeComponents