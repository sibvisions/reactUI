/** React imports */
import React, {FC, ReactElement, useCallback, useContext, useEffect, useState} from "react";
import { appContext } from "../../main/AppProvider";
import { ActiveScreen } from "../../main/ContentStore";

/**Other imports */
import { DesktopPanelHandler } from "../login/login";
import ResizeHandler from "../ResizeHandler";

/** This component defines where the workscreen should be displayed */
const WorkScreen: FC = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const [activeScreens, setActiveScreens] = useState<ActiveScreen[]>(context.contentStore.activeScreens);

    /** Returns the built windows */
    const buildWindow = useCallback((screens:ActiveScreen[]):Array<ReactElement> => {
        let tempArray: Array<ReactElement> = [];
        // if (compId === "settings") {
        //     tempArray.push(<Settings/>)
        // }
        screens.forEach(screen => {
            if (context.contentStore.getWindow(screen.name)) {
                tempArray.push(context.contentStore.getWindow(screen.name));
            }
        });
        return tempArray
    }, [context.contentStore]);

    const [renderedScreens, setRenderedScreens] = useState<Array<ReactElement>>(buildWindow(activeScreens))

    useEffect(() => {
        context.subscriptions.subscribeToActiveScreens((activeScreens:ActiveScreen[]) => setActiveScreens([...activeScreens]));

        return () => {
            context.subscriptions.unsubscribeFromActiveScreens((activeScreens:ActiveScreen[]) => setActiveScreens(activeScreens));
        }
    },[context.subscriptions])

    useEffect(() => {
        setRenderedScreens([...buildWindow(activeScreens)]);
    }, [activeScreens]);

    return (
        <ResizeHandler>
            {renderedScreens.length ? 
            renderedScreens : <DesktopPanelHandler />}
        </ResizeHandler>

    )
}
export default WorkScreen