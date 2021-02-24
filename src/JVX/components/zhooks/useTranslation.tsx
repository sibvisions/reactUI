/** React imports */
import {useContext, useEffect, useState} from "react";

/** Other imports */
import {jvxContext} from "../../jvxProvider";

/**
 * This hook returns the current state of translations
 * @returns the current state of translations
 */
const useTranslation = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Current state of the loaded translation */
    const [tranlations, setTranslations] = useState<Map<string, string>>(context.contentStore.translation);

    /**
     * Subscribes to translations which updates the state of translations of components which use the useTranslation hook
     * @returns unsubscribes from translation
     */
    useEffect(() => {
        context.contentStore.subscribeToTranslation((translationMap:Map<string, string>) => setTranslations(new Map(translationMap)));

        return () => {
            context.contentStore.unsubscribeFromTranslation((translationMap:Map<string, string>) => setTranslations(new Map(translationMap)));
        }
    });
    return tranlations
}
export default useTranslation;