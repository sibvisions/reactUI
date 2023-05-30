/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { createContext, FC, ReactElement, useContext } from "react";
import { useParams } from "react-router";
import { appContext } from "../../main/contexts/AppProvider";
import { getScreenIdFromNavigation } from "../../main/util/component-util/GetScreenNameFromNavigation";
import WorkScreen from "./workscreen/WorkScreen";

export interface IScreenContext {
    screen?: ReactElement;
}

export const ScreenContext = createContext<IScreenContext>({});

/** Displays either ScreenWrappers set by the user or the workscreen */
const ScreenManager:FC = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Extracted contentstore */
    const { contentStore, contentStore: { screenWrappers } } = context;

    /** ComponentId of Screen extracted by useParams hook */
    const { screenName } = useParams<any>();

    /** The ID of the screen based on the navigation-name */
    const screenId = getScreenIdFromNavigation(screenName, contentStore)

    /** Workscreen */
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