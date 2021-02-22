/** React imports */
import {useContext, useEffect, useState} from "react";

/** Other imports */
import {jvxContext} from "../../jvxProvider";

/**
 * This hook returns the current state of the menu status, collapsed true or false
 * @param id - id to subscribe to menuCollapse
 */
const useMenuCollapser = (id:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Current state of the menu, true, if the menu is collapsed */
    const [menuCollapsed, setMenuCollapsed] = useState<boolean>(context.contentStore.menuCollapsed);

    /** 
     * Subscribes to menuCollapse 
     * @returns unsubscribe from menuCollapse
     */
    useEffect(() => {
        context.contentStore.subscribeToMenuCollapse(id, (collapsedVal:number) => {
            /** 0 means always collapse, 1 means always expand and 2 means flipping */
            if (collapsedVal === 0)
                setMenuCollapsed(true);
            else if (collapsedVal === 1)
                setMenuCollapsed(false);
            else if (collapsedVal === 2)
                setMenuCollapsed(!menuCollapsed);
                
        });
        return () => {
            context.contentStore.unsubscribeFromMenuCollapse(id);
        }
    }, [id, context.contentStore, menuCollapsed]);

    return menuCollapsed;
}
export default useMenuCollapser