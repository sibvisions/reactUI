/** React imports */
import { useMemo } from "react";

/** Other imports */
import { HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT } from "../layouts";

/**
 * This hook returns css style properties for images based on their alignments
 * @param ha - "normal" horizontal alignment
 * @param va - "normal" vertical alignment
 * @param cha - cellEditor horizontal alignment
 * @param cva -cellEditor vertical alignment
 * @returns css style properties for images
 */
const useImageStyle = (ha: number|undefined, va: number|undefined, cha: number | undefined, cva: number | undefined, aspectRatio?:boolean) => {
    const imageAlignments = useMemo(() => {
        const cellHA = cha
        const cellVA = cva

        let horizontalAlignment = ha || cellHA;
        let verticalAlignment = va || cellVA;

        let hClassName = "";
        let vClassName = "";
        switch(horizontalAlignment) {
            case HORIZONTAL_ALIGNMENT.LEFT:
                hClassName = "image-h-left";
                break;
            case HORIZONTAL_ALIGNMENT.CENTER:
                hClassName = "image-h-center";
                break;
            case HORIZONTAL_ALIGNMENT.RIGHT:
                hClassName = "image-h-right";
                break;
            case HORIZONTAL_ALIGNMENT.STRETCH:
                hClassName = "image-h-stretch";
                break;
            default:
                hClassName = "image-h-center";
        }
        switch(verticalAlignment) {
            case VERTICAL_ALIGNMENT.TOP:
                vClassName = "image-v-top";
                break;
            case VERTICAL_ALIGNMENT.CENTER:
                vClassName = "image-v-center";
                break;
            case VERTICAL_ALIGNMENT.BOTTOM:
                vClassName = "image-v-bottom";
                break;
            case VERTICAL_ALIGNMENT.STRETCH:
                vClassName = "image-v-stretch";
                break;
            default:
                vClassName = "image-v-center";
        }
        return hClassName + " " + vClassName;
    }, [ha, va, cha, cva]);

    return imageAlignments
}
export default useImageStyle;