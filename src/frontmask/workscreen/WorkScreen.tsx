/** React imports */
import React, {FC, ReactElement, useCallback, useContext, useEffect, useState} from "react";
import { appContext } from "../../main/AppProvider";

/**Other imports */
import { IForwardRef } from "../../main/IForwardRef";
import { DesktopPanelHandler } from "../login/login";
import ResizeHandler from "../ResizeHandler";

/** This component defines where the workscreen should be displayed */
const WorkScreen: FC = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const [activeScreens, setActiveScreens] = useState<string[]>(context.contentStore.activeScreens);

    /** Returns the built windows */
    const buildWindow = useCallback((screens:string[]):Array<ReactElement> => {
        let tempArray: Array<ReactElement> = [];
        // if (compId === "settings") {
        //     tempArray.push(<Settings/>)
        // }
        screens.forEach(screen => {
            if (context.contentStore.getWindow(screen)) {
                tempArray.push(context.contentStore.getWindow(screen));
            }
        });
        return tempArray
    }, [context.contentStore]);

    const [renderedScreens, setRenderedScreens] = useState<Array<ReactElement>>(buildWindow(activeScreens))

    useEffect(() => {
        context.subscriptions.subscribeToActiveScreens((activeScreens:string[]) => setActiveScreens([...activeScreens]));

        return () => {
            context.subscriptions.unsubscribeFromActiveScreens((activeScreens:string[]) => setActiveScreens(activeScreens));
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