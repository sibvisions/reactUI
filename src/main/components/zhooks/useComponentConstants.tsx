import { CSSProperties } from "react";
import { useConstants, useLayoutValue, useProperties } from "."
import { AppContextType } from "../../AppProvider";
import BaseComponent from "../BaseComponent";
import { TopBarContextType } from "../topbar/TopBar";

const useComponentConstants = <T extends BaseComponent> (baseProps:T, fb?:CSSProperties):[AppContextType, TopBarContextType, [T], CSSProperties|undefined, Map<string, string>] => {
    const [context, topbar, translations] = useConstants();

    const [props] = useProperties<T>(baseProps.id, baseProps);

    const layoutStyle = useLayoutValue(props.id, fb);

    return [context, topbar, [props], layoutStyle, translations];
}
export default useComponentConstants