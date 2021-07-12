import { CSSProperties, useContext } from "react"
import { appContext } from "../../AppProvider";
import { LayoutContext } from "../../LayoutContext"

const check = ['left', 'top', 'width', 'height'];

const isParentHidden = (context:any, parent?:string) => {
    if (parent && context.contentStore.flatContent.has(parent)) {
        const parentElem = document.getElementById(context.contentStore.flatContent.get(parent)!.name);
        if (parentElem) {
            if (window.getComputedStyle(parentElem).visibility === "hidden") {
                return true;
            }
        }
    }
    return false;
}

export const useLayoutValue = (id: string, fallback?: CSSProperties, parent?:string): CSSProperties | undefined => {
    const layoutData = useContext(LayoutContext);
    const context = useContext(appContext)
    fallback = fallback || { position: 'fixed', visibility: 'hidden' };

    const mout = layoutData.has(id) && !isParentHidden(context, parent) ? layoutData.get(id) : fallback;

    const out = check.some(k => {
        const v = (mout as any)[k];
        return v !== undefined && isNaN(v);
    }) ? fallback : mout;
    return out;
}

export default useLayoutValue;