import { useContext, useEffect, useLayoutEffect, useState } from "react"
import { appContext } from "../../contexts/AppProvider";

const useDesignerImages = (type:string) => {
    const context = useContext(appContext);

    const [imagesChanged, setImagesChanged] = useState<boolean>(false);

    const [, setReloadImages] = useState<boolean>(false);

    useEffect(() => {
        if (context.appSettings.LOGO_BIG.includes('?v=')) {
            context.appSettings.LOGO_BIG = context.appSettings.LOGO_BIG.replace(/\?v=[0-9]*/, '?v=' + Date.now());
        }
        else {
            context.appSettings.LOGO_BIG = context.appSettings.LOGO_BIG + '?v=' + Date.now();
        }

        if (context.appSettings.LOGO_SMALL.includes('?v=')) {
            context.appSettings.LOGO_SMALL = context.appSettings.LOGO_SMALL.replace(/\?v=[0-9]*/, '?v=' + Date.now());
        }
        else {
            context.appSettings.LOGO_SMALL = context.appSettings.LOGO_SMALL + '?v=' + Date.now();
        }

        if (context.appSettings.LOGO_LOGIN.includes('?v=')) {
            context.appSettings.LOGO_LOGIN = context.appSettings.LOGO_LOGIN.replace(/\?v=[0-9]*/, '?v=' + Date.now());
        }
        else {
            context.appSettings.LOGO_LOGIN = context.appSettings.LOGO_LOGIN + '?v=' + Date.now();
        }

        setReloadImages(prevState => !prevState);
    }, [imagesChanged])

    return setImagesChanged
}
export default useDesignerImages