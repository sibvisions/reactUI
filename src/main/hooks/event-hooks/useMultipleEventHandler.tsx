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
 * Adds an event-handler to the target, also handles cleanup
 * @param targets - the element the event should be added to
 * @param event - the event
 * @param handler - the function which should be executed
 */
const useMultipleEventHandler = (targets?: HTMLElement[], event?: keyof HTMLElementEventMap, handler?: any, paramTarget?:boolean) => {
    const targetRef = useRef<HTMLElement[]>();
    const handlerRef = useRef<EventListener>();
    const eventRef = useRef<keyof HTMLElementEventMap>();

    useEffect(() => {
        if (targetRef.current && handlerRef.current && eventRef.current) {
            for (let target of targetRef.current) {
                target.removeEventListener(eventRef.current, handlerRef.current);
            }
            
        }
        targetRef.current = targets;
        handlerRef.current = handler;
        eventRef.current = event;
        if (targets) {
            for (let target of targets) {
                if (target && event && handler) {
                    if (paramTarget) {
                        target.addEventListener(event, () => handler(target))
                    }
                    target.addEventListener(event, handler);
                }
            }
        }
    }, [targets, event, handler])
}
export default useMultipleEventHandler