/** React imports */
import { useContext, useEffect, useState } from "react";

/** Other imports */
import { appContext } from "../../AppProvider";

/**
 * This hook returns the current state of translations
 * @returns the current state of translations
 */
const useTranslation = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Current state of the loaded translation */
    const [tranlations, setTranslations] = useState<Map<string, string>>(context.contentStore.translation);

    /**
     * Subscribes to translations which updates the state of translations of components which use the useTranslation hook
     * @returns unsubscribes from translation
     */
    useEffect(() => {
        context.subscriptions.subscribeToTranslation((translationMap:Map<string, string>) => setTranslations(new Map(translationMap)));

        return () => {
            context.subscriptions.unsubscribeFromTranslation((translationMap:Map<string, string>) => setTranslations(new Map(translationMap)));
        }
    },[context.subscriptions]);
    return tranlations
}
export default useTranslation;