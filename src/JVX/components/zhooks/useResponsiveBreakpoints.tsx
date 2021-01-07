import {useState, useEffect, useRef, MutableRefObject, useMemo} from "react"

const useResponsiveBreakpoints = (elRef:MutableRefObject<any>, breakPoints:number[], menuCollapsed:boolean) => {
    const [breakSize, setBreakSize] = useState(breakPoints[0]);
    const lastMenuValue = useRef(menuCollapsed);

    const observer = useMemo(() => {
        const findBreakPoint = (width:number):number => {
            if (elRef.current.classList.contains("collapsed"))
                return Math.ceil(width/10)*10;
            else
                return Math.floor(width/10)*10;
        }

        return new ResizeObserver(entries => {
            const {width} = entries[0].contentRect;
            if (menuCollapsed !== lastMenuValue.current) {
                setBreakSize(findBreakPoint(width+1))
                if ((menuCollapsed && width+1 === breakPoints.slice(-1).pop()) || (!menuCollapsed && width+1 === breakPoints[0])) {
                    lastMenuValue.current = menuCollapsed;
                }
            }
            
        })
    },[menuCollapsed, breakPoints, elRef])

    useEffect(() => {
        const currElRef = elRef.current;
        const currObserverRef = observer
        if (currElRef)
            currObserverRef.observe(elRef.current);

        return () => currObserverRef.unobserve(currElRef);
    }, [elRef, observer, menuCollapsed])

    return breakSize;
}
export default useResponsiveBreakpoints;