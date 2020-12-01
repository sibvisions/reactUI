import { CSSProperties, useMemo } from "react";
import { HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT } from "../layouts/models/ALIGNMENT";

const useImageStyle = (ha: number|undefined, va: number|undefined, cha: number | undefined, cva: number | undefined) => {
    const imageAlignments = useMemo(() => {
        const spanCSS: CSSProperties = {};
        const imgCSS: CSSProperties = {};
        const cellHA = cha
        const cellVA = cva

        let horizontalAlignment = ha || cellHA;
        let verticalAlignment = va || cellVA;

        if (horizontalAlignment === HORIZONTAL_ALIGNMENT.LEFT)
            spanCSS.justifyContent = "flex-start";
        else if (horizontalAlignment === HORIZONTAL_ALIGNMENT.CENTER)
            spanCSS.justifyContent = "center";
        else if (horizontalAlignment === HORIZONTAL_ALIGNMENT.RIGHT)
            spanCSS.justifyContent = "flex-end";
        else
            spanCSS.justifyContent = "center"

        if (verticalAlignment === VERTICAL_ALIGNMENT.TOP)
            spanCSS.alignItems = "flex-start";
        else if (verticalAlignment === VERTICAL_ALIGNMENT.CENTER)
            spanCSS.alignItems = "center";
        else if (verticalAlignment === VERTICAL_ALIGNMENT.BOTTOM)
            spanCSS.alignItems = "flex-end";
        else
            spanCSS.alignItems = "center"

        if (verticalAlignment === VERTICAL_ALIGNMENT.STRETCH && horizontalAlignment === HORIZONTAL_ALIGNMENT.STRETCH) {
            imgCSS.width = "100%";
            imgCSS.height = "100%";
            imgCSS.objectFit = "contain"
        }
        else if (horizontalAlignment === HORIZONTAL_ALIGNMENT.STRETCH) {
            spanCSS.flexFlow = "column";
            spanCSS.justifyContent = spanCSS.alignItems;
            spanCSS.alignItems = "unset";
        }
        return { span: spanCSS, img: imgCSS };
    }, [ha, va, cha, cva]);

    return imageAlignments
}
export default useImageStyle;