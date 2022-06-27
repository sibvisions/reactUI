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
import BaseComponent from "../../util/types/BaseComponent";
import { appContext } from "../../contexts/AppProvider";

/**
 * This hook returns the up to date properties for a component
 * @param id - the id of the component
 * @param init - the initial properties sent by the server
 */
const useProperties = <T extends BaseComponent>(id: string, init: T) : [T] => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Current state of the properties */
    const [props, setProps] = useState<T>(init);

    /**
     * Subscribes to propChange which will set the state of the current properties for the component
     * @returns unsubscribes from propChange
     */
    useEffect(() => {
        context.subscriptions.subscribeToPropChange(id, (value: T) => {
            setProps({...value});
        });
        return() => {
           context.subscriptions.unsubscribeFromPropChange(id);
        };
    }, [id, context.subscriptions, props]);

    return [props]
}
export default useProperties