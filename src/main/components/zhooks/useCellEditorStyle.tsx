import { CSSProperties, useEffect, useRef, useState } from "react";
import { useComponentStyle } from ".";
import { IEditor } from "../editors";
import { getColorProperties, getFontProperties } from "./useComponentStyle";

const useCellEditorStyle = (props:IEditor, baseStyle:CSSProperties):CSSProperties => {
    const [cellEditorStyle, setCellEditorStyle] = useState<CSSProperties>(baseStyle);

    /** An initial flag optimization so when initial is true we set everything at once and not setState multiple times */
    const initial = useRef<boolean>(true);

    useEffect(() => {
        if (initial.current) {
            const fontProps = getFontProperties(props.cellEditor_font_);
            const bgdProps = getColorProperties(props.cellEditor_background_, true);
            const fgdProps = getColorProperties(props.cellEditor_foreground_, false);

            setCellEditorStyle(prevStyle => ({ ...prevStyle, ...fontProps, ...bgdProps, ...fgdProps }));
            
            initial.current = false;
        }
    },[]);

    useEffect(() => {
        if (props.cellEditor_font_ !== null && !initial.current) {
            setCellEditorStyle(prevStyle => ({ ...prevStyle, ...getFontProperties(props.cellEditor_font_) }));
        }
        else if (!initial.current) {
            setCellEditorStyle(prevStyle => ({
                ...prevStyle,
                fontFamily: baseStyle.fontFamily,
                fontWeight: baseStyle.fontWeight,
                fontStyle: baseStyle.fontStyle,
                fontSize: baseStyle.fontSize
            }));
        }
    }, [props.cellEditor_font_]);

    useEffect(() => {
        if (props.cellEditor_background_ !== null && !initial.current) {
            const bgdProps = getColorProperties(props.cellEditor_background_, true);
            setCellEditorStyle(prevStyle => ({ ...prevStyle, ...bgdProps }));
        }
        else if (!initial.current) {
            setCellEditorStyle(prevStyle => ({ ...prevStyle, background: baseStyle.background }));
        }
    }, [props.cellEditor_background_]);


    useEffect(() => {
        if (props.cellEditor_foreground_ !== null && !initial.current) {
            const fgdProps = getColorProperties(props.cellEditor_foreground_, false);
            setCellEditorStyle(prevStyle => ({ ...prevStyle, ...fgdProps }));
        }
        else if (!initial.current) {
            setCellEditorStyle(prevStyle => ({ ...prevStyle, background: baseStyle.color }));
        }
    }, [props.cellEditor_foreground_]);

    return cellEditorStyle
}
export default useCellEditorStyle;