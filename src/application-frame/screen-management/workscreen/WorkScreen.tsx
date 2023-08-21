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

import React, {FC, ReactElement, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState} from "react";
import { appContext } from "../../../main/contexts/AppProvider";
import { ActiveScreen } from "../../../main/contentstore/BaseContentStore";
import ResizeHandler from "../ResizeHandler";
import IBaseComponent from "../../../main/util/types/IBaseComponent";
import { componentHandler } from "../../../main/factories/UIFactory";

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
            if (context.contentStore.getWindow(screen)) {
                tempArray.push(context.contentStore.getWindow(screen));
            }
        });
        return tempArray
    }, [context.contentStore]);

    /** The screens which need to be rendered */
    const renderedScreens = useMemo(() => {
        return buildWindow(activeScreens)
    }, [activeScreens]);

    // Subscribes to the active-screens to have the up to date active-screen state
    useLayoutEffect(() => {
        context.subscriptions.subscribeToActiveScreens("workscreen", (activeScreens:ActiveScreen[]) => setActiveScreens([...activeScreens]));

        return () => {
            context.subscriptions.unsubscribeFromActiveScreens("workscreen");
        }
    },[context.subscriptions, context.designer?.isVisible]);

    useEffect(() => {
        if (activeScreens.length && activeScreens[0] && activeScreens[0].title) {
            context.contentStore.topbarTitle = activeScreens[0].title;
            context.subscriptions.notifyScreenTitleChanged(activeScreens[0].title)
        }
        else {
            context.contentStore.topbarTitle = context.appSettings.applicationMetaData.applicationName;
            context.subscriptions.notifyScreenTitleChanged(context.appSettings.applicationMetaData.applicationName);
        }
    }, [renderedScreens]);

    return (
        <ResizeHandler>
            {renderedScreens.length ? 
            renderedScreens : context.appSettings.desktopPanel && !context.server.linkOpen ? componentHandler(context.appSettings.desktopPanel as IBaseComponent, context.contentStore) : <></>}
        </ResizeHandler>

    )
}
export default WorkScreen