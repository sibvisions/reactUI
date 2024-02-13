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

import { useState, useEffect, useMemo, useRef } from "react"

/**
 * This hook returns a new value every 10 pixels when the menu collapses or expands to trigger a resize event on the layout to
 * show a smooth transition
 * @param elRef - the reference which size should be checked
 * @param breakPoints - an array of values at which size the state should be changed
 * @param menuCollapsed - true, if the menu is currently collapsed
 */
const useResponsiveBreakpoints = (elRef:HTMLElement, breakPoints:number[], menuCollapsed:boolean) => {
    /** Current value of the size of the ref */
    const [breakSize, setBreakSize] = useState(breakPoints[0]);

    /** True, when the hook has initialised */
    const [initialise, setInitialise] = useState(false);

    /** A Timeout to set the breakpoints */
    const timeoutRef = useRef<any>(null);

    // Initialise the hook and trigger a rerender
    useEffect(() => {
        if (elRef !== null && !initialise) {
            setInitialise(true)
        }
    }, [elRef]);

    /** Creates the observer instance */
    const observer = useMemo(() => {
        clearTimeout(timeoutRef.current);
        /** Returns the nearest break point */
        const findBreakPoint = (width:number):number => {
            if (elRef && elRef.classList.contains("collapsed")) {
                return Math.ceil(width/10)*10;
            }
            else {
                return Math.floor(width/10)*10;
            }
                
        }

        return new ResizeObserver(entries => {
            timeoutRef.current = setTimeout(() => {
                /** Get the current width */
                const { width } = entries[0].contentRect;
                setBreakSize(findBreakPoint(width + 1))
            }, 100)
        })
    },[initialise])

    /**
     * Enable the observer
     * @returns disable the observer
     */
    useEffect(() => {
        const currObserverRef = observer
        if (elRef)
            currObserverRef.observe(elRef);

        return () => elRef && currObserverRef.unobserve(elRef);
    }, [elRef, observer, menuCollapsed])

    return breakSize;
}
export default useResponsiveBreakpoints;