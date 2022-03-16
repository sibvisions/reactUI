import { CSSProperties, useContext } from "react"
import { LayoutContext } from "../../LayoutContext"

const check = ['left', 'top', 'width', 'height'];

/**
 * Returns the layoutStyle of a component, the parent sets for it or the fallback
 * @param id - the id of the component
 * @param fallback - the fallback style
 */
export const useLayoutValue = (id: string, fallback?: CSSProperties): CSSProperties | undefined => {
    const layoutData = useContext(LayoutContext);
    fallback = fallback || { position: 'fixed', visibility: 'hidden' };
    const mout = layoutData.has(id) ? layoutData.get(id) : fallback;
    const out = check.some(k => {
        const v = (mout as any)[k];
        return v !== undefined && isNaN(v);
    }) ? fallback : mout;
    return out;
}

export default useLayoutValue;