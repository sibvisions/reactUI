import { CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import BaseComponent from "../BaseComponent";

const sysColorMap = new Map<string, string>([["mandatorybackground", "--mandatory-background"], ["readonlybackground", "--readonly-background"], ["invalideditorbackground", "invalid-background"]])

export function isSysColor(className:string):string {
    if (["mandatorybackground", "readonlybackground", "invalideditorbackground"].indexOf(className) !== -1) {
        return className
    }
    return "";
}

export function getColorProperties(color: string|undefined, isBackground: boolean):CSSProperties {
    const colorProperties: CSSProperties = {};
    let classNameObj:string = "";
    if (color) {
        if (color.includes(";")) {
            const splitColor = color.split(";");
            const className = splitColor[1].substring(splitColor[1].indexOf("_") + 1);

            let setColor;
            
            if (isSysColor(className)) {
                setColor = window.getComputedStyle(document.documentElement).getPropertyValue(sysColorMap.get(className) as string);
            }
            else {
                setColor = splitColor[0];
            }

            if (isBackground) {
                colorProperties.background = setColor;
            }
            else {
                colorProperties.color = setColor;
            }
            
            classNameObj = splitColor[1].substring(splitColor[1].indexOf("_") + 1);
        }
        else {
            if (isBackground) {
                colorProperties.background = color;
            }
            else {
                colorProperties.color = color;
            }
        }
    }

    return colorProperties;
}

export function getFontProperties(font?:string) {
    const fontProperties:CSSProperties = {};

    if (font) {
        const splitFont = font.split(",");
        
        if (splitFont[0] !== "Default") {
            fontProperties.fontFamily = splitFont[0];
        }

        switch (splitFont[1]) {
            case '1':
                fontProperties.fontWeight = "bold";
                break;
            case '2':
                fontProperties.fontStyle = "italic";
                break;
            case '3':
                fontProperties.fontWeight = "bold";
                fontProperties.fontStyle = "italic";
                break;
            default:
                break;
        }

        fontProperties.fontSize = splitFont[2];
    }
    return fontProperties;
};

const useComponentStyle = (props: BaseComponent):[CSSProperties, boolean] => {
    const [componentStyle, setComponentStyle] = useState<CSSProperties>({});

    /** An initial flag optimization so when initial is true we set everything at once and not setState multiple times */
    const [initial, setInitial] = useState<boolean>(true);

    useLayoutEffect(() => {
        if (initial) {
            const fontProps = getFontProperties(props.font);
            const bgdProps = getColorProperties(props.background, true);
            const fgdProps = getColorProperties(props.foreground, false);

            setComponentStyle(prevStyle => ({ ...prevStyle, ...fontProps, ...bgdProps, ...fgdProps }));
            setInitial(false);
        }
    },[])

    useEffect(() => {
        if (!initial) {
            setComponentStyle(prevStyle => ({ ...prevStyle, ...getFontProperties(props.font) }));
        }
    }, [props.font]);

    useEffect(() => {
        if (props.background && !initial) {
            const bgdProps = getColorProperties(props.background, true);

            setComponentStyle(prevStyle => ({ ...prevStyle, ...bgdProps }));
        }
    }, [props.background]);

    useEffect(() => {
        if (props.foreground && !initial) {
            const fgdProps = getColorProperties(props.foreground, false);

            setComponentStyle(prevStyle => ({ ...prevStyle, ...fgdProps }));
        }
    }, [props.foreground]);

    return [componentStyle, initial]
}
export default useComponentStyle