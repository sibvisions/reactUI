import { useEffect, useRef } from "react";

/**
 * Adds an event-handler to the target, also handles cleanup
 * @param target - the element the event should be added to
 * @param event - the event
 * @param handler - the function which should be executed
 */
const useEventHandler = (target?: HTMLElement, event?: keyof HTMLElementEventMap, handler?: EventListener) => {
    const targetRef = useRef<HTMLElement>();
    const handlerRef = useRef<EventListener>();
    const eventRef = useRef<keyof HTMLElementEventMap>();

    useEffect(() => {
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
    }, [target, event, handler])
}
export default useEventHandler