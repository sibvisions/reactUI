import { CSSProperties, useCallback, useMemo } from "react"

const useColors = (background?: string, foreground?:string) => {
    const splitColor = useCallback((color:string) => {
        let colorObj:{ color?:string, className?:string } = { color: undefined, className: undefined }
        if (color.includes(";")) {
            const splitString = color.split(";");
            colorObj.color = splitString[0];
            colorObj.className = splitString[1].substring(splitString[1].indexOf("_") + 1);
        }
        else {
            colorObj.color = color;
        }
        return colorObj;
    }, [])

    const colorProps:{ colors:CSSProperties, classNames:string[] } = useMemo(() => {
        const tempProps:{ colors:CSSProperties, classNames:string[] } = { colors: {}, classNames: [] };

        const setColorProps = (split: { color?:string, className?:string }, isBackground:boolean) => {
            isBackground ? tempProps.colors.background : tempProps.colors.color = split.color;
            if (split.className) {
                tempProps.classNames.push(split.className);
            }
        }

        if (background) {
            setColorProps(splitColor(background), true);
        }

        if (foreground) {
            setColorProps(splitColor(foreground), true);
        }

        return tempProps;
    }, [background, foreground, splitColor])

    return colorProps
}
export default useColors