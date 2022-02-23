import { CSSProperties } from "react";
import { useComponentStyle, useConstants, useLayoutValue, useProperties } from "."
import { AppContextType } from "../../AppProvider";
import BaseComponent from "../BaseComponent";
import { TopBarContextType } from "../topbar/TopBar";

const useComponentConstants = <T extends BaseComponent> (baseProps:T, fb?:CSSProperties):
[AppContextType, TopBarContextType, [T], CSSProperties|undefined, Map<string, string>, CSSProperties] => {
    const [context, topbar, translations] = useConstants();

    const [props] = useProperties<T>(baseProps.id, baseProps);

    const layoutStyle = useLayoutValue(props.parent ? props.id : "root", fb);

    const [compStyle] = useComponentStyle(props);

    return [context, topbar, [props], layoutStyle, translations, compStyle];
}
export default useComponentConstants