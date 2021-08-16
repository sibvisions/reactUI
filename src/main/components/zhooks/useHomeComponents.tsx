/** React imports */
import { ReactElement, useCallback, useContext, useEffect, useRef, useState } from "react"

/** Other imports */
//import Settings from "../../../frontmask/settings/Settings";
import { appContext } from "../../AppProvider";
import { getScreenIdFromNavigation } from "../util/GetScreenNameFromNavigation";

/**
 * This hook returns the screens which will be displayed at the "main" div multiple screens possible if popup
 * @param componentId - componentId of the screen
 */
const useHomeComponents = (componentId:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Returns the built windows */
    const buildWindow = useCallback((compId:string):Array<ReactElement> => {
        let tempArray: Array<ReactElement> = [];
        // if (compId === "settings") {
        //     tempArray.push(<Settings/>)
        // }
        if (context.contentStore.getWindow(compId)) {
            tempArray.push(context.contentStore.getWindow(compId));
        }
            
        return tempArray
    }, [context.contentStore]);

    /** Current state of the built screens which will be displayed */
    const [homeChildren, setHomeChildren] = useState<Array<ReactElement>>(buildWindow(getScreenIdFromNavigation(componentId, context.contentStore)));

    /* if the screen in the store changed update the child components */
    useEffect(() => {
        setHomeChildren(buildWindow(getScreenIdFromNavigation(componentId, context.contentStore)));
    }, [componentId, context.contentStore.getComponentByName(getScreenIdFromNavigation(componentId, context.contentStore))])

    /**
     * Adds a new window to the current homechildren e.g. a popup
     * @param compKey - componentId/navigationName of Screen
     */
    const buildHomeChildren = useRef<Function>(() => {});
    useEffect(() => {
        buildHomeChildren.current = (compKey:string) => {
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
    }, [homeChildren, context.contentStore]);

    /**
     * Removes a window from the current homechildren e.g. removing a popup
     * @param compKey - componentId/navigationName of Screen
     */
    const removeHomeChild = useRef<Function>(() => {});
    useEffect(() => {
        removeHomeChild.current = (compKey:string) => {
            const cl = new Array<ReactElement>();
            homeChildren.forEach(hc => {
                if (hc.props.screen_navigationName_ !== compKey)
                    cl.push(hc)
            });
            setHomeChildren(cl);
        }
    }, [homeChildren]);

    /** 
     * Subscribes to popupChange which either adds a popup to the current homechildren, or removes a popup
     * @returns unsubscribing from popupChange 
     */
    useEffect(() => {
        const popupSubscription = (compKey:string, remove:boolean) => {
            if (remove) {
                removeHomeChild.current(compKey);
            } else {
                buildHomeChildren.current(compKey);
            }
        }

        context.subscriptions.subscribeToPopupChange(popupSubscription);

        return () => {
            context.subscriptions.unsubscribeFromPopupChange(popupSubscription);
        }
    }, [context.subscriptions]);

    return homeChildren
}
export default useHomeComponents