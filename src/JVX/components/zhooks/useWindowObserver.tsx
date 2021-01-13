import {useState, useEffect} from 'react'

const useWindowObserver = () => {
    const [windowSize, setWindowSize] = useState<0|1>(0)

    useEffect(() => {
        const setWindowState = () => {
            if (window.innerWidth <= 1030 && windowSize !== 0)
                setWindowSize(0);
            else if (window.innerWidth > 1030 && windowSize !== 1)
                setWindowSize(1);
        }
        setWindowState()
        window.addEventListener('resize', setWindowState);

        return () => window.removeEventListener('resize', setWindowState);
    })

    return windowSize;
}
export default useWindowObserver;