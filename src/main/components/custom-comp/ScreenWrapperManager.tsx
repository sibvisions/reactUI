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

import React, { FC, ReactElement, useContext } from "react"
import { useParams } from "react-router";
import { appContext } from "../../contexts/AppProvider"
import WorkScreen from "../../../application-frame/screen-management/workscreen/WorkScreen";
import { getScreenIdFromNavigation } from "../../util/component-util/GetScreenNameFromNavigation";

/** This component for global screen-wrapppers, decides wether the screen should display a screen-wrapper or just the workscreen */
const ScreenWrapperManager:FC = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** ComponentId of Screen extracted by useParams hook */
    const {componentId} = useParams<any>();
    
    /** The ID of the screen based on the navigation-name */
    const screenId = getScreenIdFromNavigation(componentId, context.contentStore)

    return context.contentStore.screenWrappers.has(screenId) ? 
        context.contentStore.screenWrappers.get(screenId || "")?.wrapper as ReactElement : 
        <WorkScreen/>
}
export default ScreenWrapperManager;