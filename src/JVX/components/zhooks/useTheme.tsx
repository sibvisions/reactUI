import {useContext, useEffect, useState} from "react";
import {jvxContext} from "../../jvxProvider";

const useTheme = () => {
    const context = useContext(jvxContext);
    const [currentTheme, setCurrentTheme] = useState<string>(context.contentStore.currentTheme)

    useEffect(() => {
        setCurrentTheme(context.contentStore.currentTheme)
    }, [context.contentStore.currentTheme])

    return currentTheme
}
export default useTheme