import { useMemo } from "react";
import { HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT } from "../../components/layouts";

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

        const imgClassNames:string[] = []
        switch(horizontalAlignment) {
            case HORIZONTAL_ALIGNMENT.LEFT:
                imgClassNames.push("image-h-left");
                break;
            case HORIZONTAL_ALIGNMENT.CENTER:
                imgClassNames.push("image-h-center");
                break;
            case HORIZONTAL_ALIGNMENT.RIGHT:
                imgClassNames.push("image-h-right");
                break;
            case HORIZONTAL_ALIGNMENT.STRETCH:
                imgClassNames.push("image-h-stretch");
                break;
            default:
                imgClassNames.push("image-h-center");
        }
        switch(verticalAlignment) {
            case VERTICAL_ALIGNMENT.TOP:
                imgClassNames.push("image-v-top");
                break;
            case VERTICAL_ALIGNMENT.CENTER:
                imgClassNames.push("image-v-center");
                break;
            case VERTICAL_ALIGNMENT.BOTTOM:
                imgClassNames.push("image-v-bottom");
                break;
            case VERTICAL_ALIGNMENT.STRETCH:
                imgClassNames.push("image-v-stretch");
                break;
            default:
                imgClassNames.push("image-v-center");
        }

        if (horizontalAlignment === HORIZONTAL_ALIGNMENT.STRETCH && verticalAlignment === VERTICAL_ALIGNMENT.STRETCH && aspectRatio) {
            imgClassNames.push("image-aspect-ratio")
        }

        return imgClassNames.filter(Boolean).join(' ')
    }, [ha, va, cha, cva, aspectRatio]);

    return imageAlignments
}
export default useImageStyle;