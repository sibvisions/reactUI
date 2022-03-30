import { useContext, useEffect, useState } from "react";
import { appContext } from "../../AppProvider";

/**
 * This Hook returns the screenTitle of either the application if no screen is active or the currently active screen.
 */
const useScreenTitle = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of screen title, displays the screen title */
    const [screenTitle, setScreenTitle] = useState<string>("");

    useEffect(() => {
        context.subscriptions.subscribeToScreenTitle((appName: string) => setScreenTitle(appName));

        return () => context.subscriptions.unsubscribeFromScreenTitle();
    }, [context.subscriptions]);

    return screenTitle
}
export default useScreenTitle