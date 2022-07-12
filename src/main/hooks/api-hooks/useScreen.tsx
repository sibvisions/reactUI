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

import { ReactElement, useContext } from "react";
import { appContext } from "../../contexts/AppProvider";

type ScreenAPIType = {
    sendScreenParameter: (parameter: {[key:string]: any}) => void,
    sendCloseScreenRequest: (parameter?: {[key:string]: any}) => void,
    addCustomComponent: (name: string, customComp: ReactElement) => void,
    removeComponent: (name:string) => void
}

/**
 * Returns functions of the api class for screens without being forced to enter the screen-name everytime
 * @param screenName - the screen name
 */
const useScreen = (screenName: string): ScreenAPIType => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const sendScreenParameter = (parameter: { [key: string]: any }) => {
        context.api.sendScreenParameter(screenName, parameter);
    }

    const sendCloseScreenRequest = (parameter?: {[key:string]: any}) => {
        context.api.sendCloseScreenRequest(screenName, parameter);
    }

    const addCustomComponent = (name: string, customComp: ReactElement) => {
        context.api.addCustomComponent(name, customComp);
    }

    const removeComponent = (name: string) => {
        context.api.removeComponent(name);
    }

    return {
        sendScreenParameter: sendScreenParameter,
        sendCloseScreenRequest: sendCloseScreenRequest,
        addCustomComponent: addCustomComponent,
        removeComponent: removeComponent
    }
}
export default useScreen;