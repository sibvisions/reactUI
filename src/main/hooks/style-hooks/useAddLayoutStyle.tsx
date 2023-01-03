import { CSSProperties, useEffect } from "react";
import LoadCallBack from "../../util/types/LoadCallBack";

const useAddLayoutStyle = (ref: any, layoutStyle: CSSProperties|undefined, loadBackFunction:LoadCallBack|undefined) => {
    useEffect(() => {
        if (ref) {
            ref.style.setProperty("top", layoutStyle?.top !== undefined ? `${layoutStyle.top}px`: null)
            ref.style.setProperty("left", layoutStyle?.left !== undefined ? `${layoutStyle.left}px`: null);
            ref.style.setProperty("width", layoutStyle?.width !== undefined ? `${layoutStyle.width}px`: null);
            ref.style.setProperty("height", layoutStyle?.height !== undefined ? `${layoutStyle.height}px`: null);
        }
    }, [layoutStyle, loadBackFunction])
}
export default useAddLayoutStyle