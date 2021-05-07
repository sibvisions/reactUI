/** React imports */
import { useContext, useEffect, useState } from "react";

/** Other imports */
import { appContext } from "../../AppProvider";

/**
 * This hook returns the current state of the menu status, collapsed true or false
 * @param id - id to subscribe to menuCollapse
 */
const useMenuCollapser = (id:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Current state of the menu, true, if the menu is collapsed */
    const [menuCollapsed, setMenuCollapsed] = useState<boolean>(context.contentStore.menuCollapsed);

    /** 
     * Subscribes to menuCollapse 
     * @returns unsubscribe from menuCollapse
     */
    useEffect(() => {
        context.subscriptions.subscribeToMenuCollapse(id, (collapsedVal:number) => {
            /** 0 means always collapse, 1 means always expand and 2 means flipping */
            if (collapsedVal === 0)
                setMenuCollapsed(true);
            else if (collapsedVal === 1)
                setMenuCollapsed(false);
            else if (collapsedVal === 2)
                setMenuCollapsed(!menuCollapsed);
                
        });
        return () => {
            context.subscriptions.unsubscribeFromMenuCollapse(id);
        }
    }, [id, context.subscriptions, menuCollapsed]);

    return menuCollapsed;
}
export default useMenuCollapser