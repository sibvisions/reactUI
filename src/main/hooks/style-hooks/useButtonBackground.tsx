/* Copyright 2023 SIB Visions GmbH
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

/** This hook subscribes to the button background changes made by the designer and updates the state to rerender. */
const useButtonBackground = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** State to notify when button background changes */
    const [designerBgdChanged, setDesignerBgdChanged] = useState<boolean>(false);

    /** Subscribes to button background changes */
    useEffect(() => {
        context.designerSubscriptions.subscribeToButtonBackground(() => setDesignerBgdChanged(prevState => !prevState))

        return () => context.designerSubscriptions.unsubscribeFromButtonBackground(() => setDesignerBgdChanged(prevState => !prevState));
    },[context.subscriptions]);

    return designerBgdChanged;
}
export default useButtonBackground