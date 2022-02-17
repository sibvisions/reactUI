import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react"
import BaseComponent from "../BaseComponent";

export type StyleClassNames = {
    bgdClassName: string,
    fgdClassName: string
}

export function isSysColor(className:string):boolean {
    return ["mandatorybackground", "readonlybackground", "invalideditorbackground"].indexOf(className) !== -1;
}

export function getColorProperties(color: string|undefined, isBackground: boolean):{style: CSSProperties, className: string} {
    const colorProperties: CSSProperties = {};
    let classNameObj:string = "";
    if (color) {
        if (color.includes(";")) {
            const splitColor = color.split(";");

            if (isBackground) {
                if (!isSysColor) {
                    colorProperties.background = splitColor[0];
                }
            }
            else {
                if (!isSysColor) {
                    colorProperties.color = splitColor[0];
                }
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

    return { style: colorProperties, className: classNameObj};
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

const useComponentStyle = (props: BaseComponent):[CSSProperties, StyleClassNames, boolean] => {
    const [componentStyle, setComponentStyle] = useState<CSSProperties>({});

    const [styleClassNames, setStyleClassNames] = useState<StyleClassNames>({ bgdClassName: "", fgdClassName: "" });

    /** An initial flag optimization so when initial is true we set everything at once and not setState multiple times */
    const [initial, setInitial] = useState<boolean>(true);

    useEffect(() => {
        if (initial) {
            const fontProps = getFontProperties(props.font);
            const bgdProps = getColorProperties(props.background, true);
            const fgdProps = getColorProperties(props.foreground, false);

            setComponentStyle(prevStyle => ({ ...prevStyle, ...fontProps, ...bgdProps.style, ...fgdProps.style }));
            setStyleClassNames({ bgdClassName: bgdProps.className, fgdClassName: fgdProps.className });
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

            setComponentStyle(prevStyle => ({ ...prevStyle, ...bgdProps.style }));
            setStyleClassNames(prevState => ({ ...prevState, bgdClassName: bgdProps.className }));
        }
    }, [props.background]);

    useEffect(() => {
        if (props.foreground && !initial) {
            const fgdProps = getColorProperties(props.foreground, false);

            setComponentStyle(prevStyle => ({ ...prevStyle, ...fgdProps.style }));
            setStyleClassNames(prevState => ({ ...prevState, fgdClassName: fgdProps.className }));
        }
    }, [props.foreground]);

    return [componentStyle, styleClassNames, initial]
}
export default useComponentStyle