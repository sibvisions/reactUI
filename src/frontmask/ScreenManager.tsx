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

/** Displays either ScreenWrappers set by the user or the workscreen */
const ScreenManager:FC = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    const { contentStore, contentStore: { screenWrappers } } = context;
    /** ComponentId of Screen extracted by useParams hook */
    const {componentId} = useParams<any>();
    /** The ID of the screen based on the navigation-name */
    const screenId = getScreenIdFromNavigation(componentId, contentStore)

    const screen = <WorkScreen />;

    /** If there is a screen-wrapper for this screen, check if there is a global and global should be shown, if true show global if false don't */
    if (screenWrappers.has(screenId)) {
        const screenWrapper = screenWrappers.get(screenId)
        if (screenWrappers.has('global') && screenWrapper?.options.global){
            const content = <ScreenContext.Provider value={{screen}}>
                {React.cloneElement(screenWrapper.wrapper, {screenName: screenId})}
            </ScreenContext.Provider>
            return <ScreenContext.Provider value={{screen: content}}>
                {screenWrappers.get('global')?.wrapper}
            </ScreenContext.Provider>
        } else { 
            return <ScreenContext.Provider value={{screen}}>
                {React.cloneElement(screenWrapper!.wrapper, {screenName: screenId})}
            </ScreenContext.Provider>
        }
    }
    /** If there is a global-screen-wrapper show it, if not just show the workscreen */
    else if (screenWrappers.has('global')) {
        return <ScreenContext.Provider value={{screen}}>
            {screenWrappers.get('global')?.wrapper}
        </ScreenContext.Provider>
    } else {
        return screen
    }
}
export default ScreenManager