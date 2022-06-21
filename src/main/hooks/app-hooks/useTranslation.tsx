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
 * This hook returns the current state of translations
 * @returns the current state of translations
 */
const useTranslation = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Current state of the loaded translation */
    const [tranlations, setTranslations] = useState<Map<string, string>>(context.contentStore.translation);

    /**
     * Subscribes to translations which updates the state of translations of components which use the useTranslation hook
     * @returns unsubscribes from translation
     */
    useEffect(() => {
        context.subscriptions.subscribeToTranslation((translationMap:Map<string, string>) => setTranslations(new Map(translationMap)));

        return () => {
            context.subscriptions.unsubscribeFromTranslation((translationMap:Map<string, string>) => setTranslations(new Map(translationMap)));
        }
    },[context.subscriptions]);
    return tranlations
}
export default useTranslation;