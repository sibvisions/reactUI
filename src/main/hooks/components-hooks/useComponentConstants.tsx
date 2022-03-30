import { CSSProperties } from "react";
import { useComponentStyle, useConstants, useLayoutValue, useProperties } from ".."
import { AppContextType } from "../../AppProvider";
import BaseComponent from "../../util/types/BaseComponent";
import { TopBarContextType } from "../../components/topbar/TopBar";

/**
 * Returns the component constants which almost every component uses
 * @param baseProps - the baseproperties a component receives from the server
 * @param fb - the fallback value for styles
 */
const useComponentConstants = <T extends BaseComponent> (baseProps:T, fb?:CSSProperties):
[AppContextType, TopBarContextType, [T], CSSProperties|undefined, Map<string, string>, CSSProperties] => {
    /** Returns utility variables */
    const [context, topbar, translations] = useConstants();

    /** Up to date properties for the component */
    const [props] = useProperties<T>(baseProps.id, {...baseProps});

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.parent ? props.id : "root", fb);

    /** get the component style of the component */
    const [compStyle] = useComponentStyle(props);

    return [context, topbar, [props], layoutStyle, translations, compStyle];
}
export default useComponentConstants