import { useLayoutEffect, useRef } from "react";

//Calls a function after layouting
export function useRunAfterLayout() {
    let torun = useRef<Function[]>([]);
    
    useLayoutEffect(() => {
        while(torun.current.length) {
            const f = torun.current.pop();
            f && f();
        }
        torun.current = [];
    }, [torun.current]);

    return (r:Function) => {
        torun.current.push(r)
    }
} 