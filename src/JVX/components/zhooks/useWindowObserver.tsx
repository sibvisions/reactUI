import {useState, useEffect} from 'react'

const useWindowObserver = () => {
    const [windowSize, setWindowSize] = useState<boolean>(false)

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