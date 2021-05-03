import { useEffect, useRef } from "react";

const useEventHandler = (target?: HTMLElement, event?: keyof HTMLElementEventMap, handler?: EventListener) => {
    const targetRef = useRef<HTMLElement>();
    const handlerRef = useRef<EventListener>();
    const eventRef = useRef<keyof HTMLElementEventMap>();

    useEffect(() => {
        if (targetRef.current && handlerRef.current && eventRef.current) {
            targetRef.current.removeEventListener(eventRef.current, handlerRef.current);
        }
        targetRef.current = target;
        handlerRef.current = handler;
        eventRef.current = event;
        if (target && event && handler) {
            target.addEventListener(event, handler);
        }
    }, [target, event, handler])
}
export default useEventHandler