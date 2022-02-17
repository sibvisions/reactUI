import { CSSProperties } from "react";
import { useComponentStyle, useConstants, useLayoutValue, useProperties } from "."
import { AppContextType } from "../../AppProvider";
import BaseComponent from "../BaseComponent";
import { TopBarContextType } from "../topbar/TopBar";
import { StyleClassNames } from "./useComponentStyle";

const useComponentConstants = <T extends BaseComponent> (baseProps:T, fb?:CSSProperties):
[AppContextType, TopBarContextType, [T], CSSProperties|undefined, Map<string, string>, CSSProperties, StyleClassNames] => {
    const [context, topbar, translations] = useConstants();

    const [props] = useProperties<T>(baseProps.id, baseProps);

    const layoutStyle = useLayoutValue(props.id, fb);

    const [compStyle, styleClassNames] = useComponentStyle(props);

    return [context, topbar, [props], layoutStyle, translations, compStyle, styleClassNames];
}
export default useComponentConstants