import { useContext, useEffect, useState } from "react";
import { appContext } from "../../contexts/AppProvider";

const useButtonBackground = () => {
    const context = useContext(appContext);

    const [designerBgdChanged, setDesignerBgdChanged] = useState<boolean>(false);

    useEffect(() => {
        context.designerSubscriptions.subscribeToButtonBackground(() => setDesignerBgdChanged(prevState => !prevState))

        return () => context.designerSubscriptions.unsubscribeFromButtonBackground(() => setDesignerBgdChanged(prevState => !prevState));
    },[context.subscriptions]);

    return designerBgdChanged;
}
export default useButtonBackground