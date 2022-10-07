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

import { useContext, useEffect, useState } from "react";
import { appContext } from "../../contexts/AppProvider";

/**
 * This Hook returns the screenTitle of either the application if no screen is active or the currently active screen.
 */
const useScreenTitle = (init:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of screen title, displays the screen title */
    const [screenTitle, setScreenTitle] = useState<string>(init);

    // Subscribes to the screen-title
    useEffect(() => {
        context.subscriptions.subscribeToScreenTitle((screenTitle: string) => setScreenTitle(screenTitle));

        return () => context.subscriptions.unsubscribeFromScreenTitle();
    }, [context.subscriptions]);

    return screenTitle
}
export default useScreenTitle