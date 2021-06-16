/** React imports */
import React, { createContext, FC, ReactElement, useContext } from "react";
import { useParams } from "react-router";

/** Other imports */
import { getScreenIdFromNavigation } from "../main/components/util";
import { IForwardRef } from "../main/IForwardRef";

/** Other imports */
import { appContext } from "../main/AppProvider";
import WorkScreen from "./workscreen/WorkScreen";

export interface IScreenContext {
    screen?: ReactElement;
}

export const ScreenContext = createContext<IScreenContext>({});

/** Displays either CustomOverlays set by the user or the workscreen */
const ScreenManager:FC<IForwardRef> = ({forwardedRef}) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    const { contentStore, contentStore: { customOverlays } } = context;
    /** ComponentId of Screen extracted by useParams hook */
    const {componentId} = useParams<any>();
    /** The ID of the screen based on the navigation-name */
    const screenId = getScreenIdFromNavigation(componentId, contentStore)

    const screen = <WorkScreen forwardedRef={forwardedRef} />;

    /** If there is a custom-overlay for this screen, check if there is a global and global should be shown, if true show global if false don't */
    if (customOverlays.has(screenId)) {
        const customOverlay = customOverlays.get(screenId)
        if (customOverlays.has('global') && customOverlay?.options.global){
            const content = <ScreenContext.Provider value={{screen}}>
                {customOverlay?.overlay}
            </ScreenContext.Provider>
            return <ScreenContext.Provider value={{screen: content}}>
                {customOverlays.get('global')?.overlay}
            </ScreenContext.Provider>
        } else { 
            return <ScreenContext.Provider value={{screen}}>
                {customOverlay?.overlay}
            </ScreenContext.Provider>
        }
    }
    /** If there is a custom-global-overlay show it, if not just show the workscreen */
    else if (customOverlays.has('global')) {
        return <ScreenContext.Provider value={{screen}}>
            {customOverlays.get('global')?.overlay}
        </ScreenContext.Provider>
    } else {
        return screen
    }
}
export default ScreenManager