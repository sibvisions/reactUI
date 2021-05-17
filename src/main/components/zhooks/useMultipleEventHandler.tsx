import { useEffect, useRef } from "react";

/**
 * Adds an event-handler to the target, also handles cleanup
 * @param target - the element the event should be added to
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