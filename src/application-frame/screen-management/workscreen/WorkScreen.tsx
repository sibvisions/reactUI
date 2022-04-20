import React, {FC, ReactElement, useCallback, useContext, useEffect, useMemo, useState} from "react";
import { appContext } from "../../../main/AppProvider";
import { ActiveScreen } from "../../../main/contentstore/BaseContentStore";
import { DesktopPanelHandler } from "../../login";
import ResizeHandler from "../ResizeHandler";

/** This component defines where the workscreen should be displayed */
const WorkScreen: FC = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** State of the active-screens */
    const [activeScreens, setActiveScreens] = useState<ActiveScreen[]>(context.contentStore.activeScreens);

    /** Returns the built windows */
    const buildWindow = useCallback((screens:ActiveScreen[]):Array<ReactElement> => {
        let tempArray: Array<ReactElement> = [];
        screens.forEach(screen => {
            if (context.contentStore.getWindow(screen.name)) {
                tempArray.push(context.contentStore.getWindow(screen.name));
            }
        });
        return tempArray
    }, [context.contentStore]);

    /** The screens which need to be rendered */
    const renderedScreens = useMemo(() => {
        if (activeScreens.length) {
            context.subscriptions.emitSelectedMenuItem(activeScreens.slice(-1).pop()!.className as string);
        }
        else {
            context.subscriptions.emitSelectedMenuItem("");
        }
        return buildWindow(activeScreens)
    }, [activeScreens]);

    // Subscribes the WorkScreen component to the active-screens to have the up to date active-screen state
    useEffect(() => {
        context.subscriptions.subscribeToActiveScreens("workscreen", (activeScreens:ActiveScreen[]) => setActiveScreens([...activeScreens]));

        return () => {
            context.subscriptions.unsubscribeFromActiveScreens("workscreen");
        }
    },[context.subscriptions])

    return (
        <ResizeHandler>
            {renderedScreens.length ? 
            renderedScreens : context.appSettings.desktopPanel ? <DesktopPanelHandler /> : <></>}
        </ResizeHandler>

    )
}
export default WorkScreen