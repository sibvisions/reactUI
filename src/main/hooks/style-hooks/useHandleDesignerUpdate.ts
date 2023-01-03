import { CSSProperties, useEffect, useLayoutEffect } from "react";
import { removeLayoutStyle } from "../../util/component-util/RemoveLayoutStyle";
import LoadCallBack from "../../util/types/LoadCallBack";
import useAddLayoutStyle from "./useAddLayoutStyle";

const useHandleDesignerUpdate = (designerUpdate:boolean|undefined, ref: any, layoutStyle: CSSProperties|undefined, loadCallBack:Function, loadCallBackFunc:LoadCallBack|undefined) => {
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

    useAddLayoutStyle(ref, layoutStyle, loadCallBackFunc)
}
export default useHandleDesignerUpdate