import { useState, useEffect, useRef, MutableRefObject, useMemo } from "react"

/**
 * This hook returns a new value every 10 pixels when the menu collapses or expands to trigger a resize event on the layout to
 * show a smooth transition
 * @param elRef - the reference which size should be checked
 * @param breakPoints - an array of values at which size the state should be changed
 * @param menuCollapsed - true, if the menu is currently collapsed
 */
const useResponsiveBreakpoints = (elRef:MutableRefObject<any>, breakPoints:number[], menuCollapsed:boolean) => {
    /** Current value of the size of the ref */
    const [breakSize, setBreakSize] = useState(breakPoints[0]);

    const observer = useMemo(() => {
        /** Returns the nearest break point */
        const findBreakPoint = (width:number):number => {
            if (elRef.current.classList.contains("collapsed"))
                return Math.ceil(width/10)*10;
            else
                return Math.floor(width/10)*10;
        }

        return new ResizeObserver(entries => {
            /** Get the current width */
            const {width} = entries[0].contentRect;
            setBreakSize(findBreakPoint(width+1))
            
        })
    },[menuCollapsed, breakPoints, elRef])

    /**
     * Enable the observer
     * @returns disable the observer
     */
    useEffect(() => {
        const currElRef = elRef.current;
        const currObserverRef = observer
        if (currElRef)
            currObserverRef.observe(currElRef);

        return () => currElRef && currObserverRef.unobserve(currElRef);
    }, [elRef, observer, menuCollapsed])

    return breakSize;
}
export default useResponsiveBreakpoints;