import {useContext, useEffect, useState} from "react";
import {jvxContext} from "../../jvxProvider";

const useMenuCollapser = (id:string) => {
    const context = useContext(jvxContext);
    const [menuCollapsed, setMenuCollapsed] = useState<boolean>(context.contentStore.menuCollapsed);

    useEffect(() => {
        context.contentStore.subscribeToMenuCollapse(id, (collapsedVal:number) => {
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