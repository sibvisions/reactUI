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
import COMPONENT_CLASSNAMES from "../../components/COMPONENT_CLASSNAMES";

/**
 * Adds an event-handler to the target, also handles cleanup
 * @param target - the element the event should be added to
 * @param event - the event
 * @param handler - the function which should be executed
 */
const useEventHandler = <K extends keyof HTMLElementEventMap>(target?: HTMLElement, event?: K, handler?: (e: HTMLElementEventMap[K]) => any, isTable?: boolean, className?: string) => {
    const targetRef = useRef<HTMLElement>();
    const handlerRef = useRef<(e: HTMLElementEventMap[K]) => any>();
    const eventRef = useRef<K>();

    useEffect(() => {
        if (isTable || className !== COMPONENT_CLASSNAMES.TABLE) {
            if(!target?.addEventListener){
                return
            }
    
            if (targetRef.current && handlerRef.current && eventRef.current) {
                targetRef.current.removeEventListener(eventRef.current, handlerRef.current);
            }
            targetRef.current = target;
            handlerRef.current = handler;
            eventRef.current = event;
            if (target && event && handler) {
                target.addEventListener(event, handler);
            }
    
            return () =>  {
                if (targetRef.current && handlerRef.current && eventRef.current) {
                    targetRef.current.removeEventListener(eventRef.current, handlerRef.current);
                }
            }
        }
    }, [target, event, handler])
}
export default useEventHandler