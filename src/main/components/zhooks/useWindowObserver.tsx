/** React imports */
import { useState, useEffect } from 'react'

/** Returns true, if the window is smaller than 1030px to collapse the menu */
const useWindowObserver = () => {
    const [windowSize, setWindowSize] = useState<boolean>(false)

    /**
     * Sets state and adds resizeListener
     * @returns removes eventListener
     */
    useEffect(() => {
        const setWindowState = () => {
            if (window.innerWidth <= 1030 && windowSize)
                setWindowSize(false);
            else if (window.innerWidth > 1030 && !windowSize)
                setWindowSize(true);
        }
        setWindowState()
        window.addEventListener('resize', setWindowState);

        return () => window.removeEventListener('resize', setWindowState);
    })

    return windowSize;
}
export default useWindowObserver;