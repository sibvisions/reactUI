import { useContext } from "react"
import { useTranslation } from "..";
import { appContext, AppContextType } from "../../AppProvider"
import { TopBarContext, TopBarContextType } from "../../components/topbar/TopBar";

/**
 * This hook returns the constants which are most used by other components
 */
const useConstants = ():[AppContextType, TopBarContextType, Map<string, string>] => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of translations */
    const translations = useTranslation();

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    return [context, topbar, translations]
}
export default useConstants