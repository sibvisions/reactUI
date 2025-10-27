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

import { useEffect, useRef } from "react";

/**
 * Adds an event-handler to the target, also handles cleanup for multiple elements
 * @param targets - the element the event should be added to
 * @param event - the event
 * @param handler - the function which should be executed
 */
const useMultipleEventHandler = (targets?: HTMLElement[], event?: keyof HTMLElementEventMap, handler?: any) => {
    const savedHandler = useRef<(e: Event) => void | undefined>(undefined);

    useEffect(() => {
        if (!targets || !event || !handler) return;

        savedHandler.current = (e: Event) => {
            handler(e);
        };

        targets.forEach(t => t.addEventListener(event, savedHandler.current!));

        return () => {
            targets.forEach(t => t.removeEventListener(event, savedHandler.current!));
        };
    }, [targets, event, handler])
}
export default useMultipleEventHandler