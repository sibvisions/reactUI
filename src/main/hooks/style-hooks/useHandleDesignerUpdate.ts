import { CSSProperties, useLayoutEffect } from "react";
import { removeLayoutStyle } from "../../util/component-util/RemoveLayoutStyle";

const useHandleDesignerUpdate = (designerUpdate:boolean|undefined, ref: any, layoutStyle: CSSProperties|undefined, loadCallBack:Function) => {
    useLayoutEffect(() => {
        if (ref && designerUpdate !== undefined) {
            const cloneElem = ref.cloneNode(true) as HTMLElement;
            cloneElem.style.visibility = "hidden";
            ref.after(cloneElem)
            removeLayoutStyle(cloneElem);
            loadCallBack(cloneElem)
            cloneElem.remove();
        }
    }, [designerUpdate])

    useLayoutEffect(() => {
        if (ref) {
            ref.style.setProperty("top", layoutStyle?.top !== undefined ? `${layoutStyle.top}px`: null)
            ref.style.setProperty("left", layoutStyle?.left !== undefined ? `${layoutStyle.left}px`: null);
            ref.style.setProperty("width", layoutStyle?.width !== undefined ? `${layoutStyle.width}px`: null);
            ref.style.setProperty("height", layoutStyle?.height !== undefined ? `${layoutStyle.height}px`: null);
        }
    }, [layoutStyle])
}
export default useHandleDesignerUpdate