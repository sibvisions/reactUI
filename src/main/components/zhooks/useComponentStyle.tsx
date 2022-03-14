import { CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import BaseComponent from "../BaseComponent";

const sysColorMap = new Map<string, string>([["mandatorybackground", "--mandatory-background"], ["readonlybackground", "--readonly-background"], ["invalideditorbackground", "invalid-background"]])

export function isSysColor(className:string):string {
    if (["mandatorybackground", "readonlybackground", "invalideditorbackground"].indexOf(className) !== -1) {
        return className
    }
    return "";
}

/** Returns the color-properties for a component */
export function getColorProperties(color: string|undefined, isBackground: boolean):CSSProperties {
    const colorProperties: CSSProperties = {};
    if (color) {
        if (color.includes(";")) {
            const splitColor = color.split(";");
            //Filter out the className if available
            const className = splitColor[1].substring(splitColor[1].indexOf("_") + 1);

            let setColor;
            
            //Check if the className is a syscolor, if true take the value of the css variable, else just take the color sent by the server
            if (isSysColor(className)) {
                setColor = window.getComputedStyle(document.documentElement).getPropertyValue(sysColorMap.get(className) as string);
            }
            else {
                setColor = splitColor[0];
            }

            // Either set Background or Textcolor
            if (isBackground) {
                colorProperties.background = setColor;
            }
            else {
                colorProperties.color = setColor;
            }
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

/**
 * Returns the font properties parsed
 * @param font - the font string sent by the server
 */
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

/**
 * Returns the style as CSSProperties and if its initially set
 * @param props - the properties of the components
 */
const useComponentStyle = (props: BaseComponent):[CSSProperties, boolean] => {
    /** The componentstyle state */
    const [componentStyle, setComponentStyle] = useState<CSSProperties>({});

    /** An initial flag optimization so when initial is true we set everything at once and not setState multiple times */
    const [initial, setInitial] = useState<boolean>(true);

    // Initially set the component-styles
    useLayoutEffect(() => {
        if (initial) {
            const fontProps = getFontProperties(props.font);
            const bgdProps = getColorProperties(props.background, true);
            const fgdProps = getColorProperties(props.foreground, false);

            setComponentStyle(prevStyle => ({ ...prevStyle, ...fontProps, ...bgdProps, ...fgdProps }));
            setInitial(false);
        }
    },[])

    // If the font changes, parse it again and set the state
    useEffect(() => {
        if (!initial) {
            setComponentStyle(prevStyle => ({ ...prevStyle, ...getFontProperties(props.font) }));
        }
    }, [props.font]);

    // If the background changes, parse it again and set the state
    useEffect(() => {
        if (props.background && !initial) {
            const bgdProps = getColorProperties(props.background, true);

            setComponentStyle(prevStyle => ({ ...prevStyle, ...bgdProps }));
        }
    }, [props.background]);

    // If the foreground changes, parse it again and set the state
    useEffect(() => {
        if (props.foreground && !initial) {
            const fgdProps = getColorProperties(props.foreground, false);

            setComponentStyle(prevStyle => ({ ...prevStyle, ...fgdProps }));
        }
    }, [props.foreground]);

    return [componentStyle, initial]
}
export default useComponentStyle