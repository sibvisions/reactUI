import {useState, useEffect, useRef, MutableRefObject} from "react"

const useResponsiveBreakpoints = (elRef:MutableRefObject<any>, breakPoints:number[]) => {
    const [breakSize, setBreakSize] = useState(breakPoints[0]);

    const findBreakPoint = (width:number):number => {
        if (elRef.current.classList.contains("collapsed"))
            return Math.ceil(width/10)*10;
        else
            return Math.floor(width/10)*10;
    }

    const observer = useRef(
        new ResizeObserver(entries => {
            const {width} = entries[0].contentRect;
            setBreakSize(findBreakPoint(width+1))
        })
    );

    useEffect(() => {
        const currElRef = elRef.current;
        const currObserverRef = observer.current
        if (currElRef)
            currObserverRef.observe(elRef.current);

        return () => currObserverRef.unobserve(currElRef);
    }, [elRef, observer])

    return breakSize;
}
export default useResponsiveBreakpoints;