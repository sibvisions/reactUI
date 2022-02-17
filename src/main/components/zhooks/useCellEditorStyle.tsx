import { CSSProperties, useEffect, useRef, useState } from "react";
import { useComponentStyle } from ".";
import { IEditor } from "../editors";
import { getColorProperties, getFontProperties, StyleClassNames } from "./useComponentStyle";

const useCellEditorStyle = (props:IEditor, baseStyle:CSSProperties, baseClassName:StyleClassNames):[CSSProperties, StyleClassNames] => {
    const [cellEditorStyle, setCellEditorStyle] = useState<CSSProperties>(baseStyle);

    const [cellEditorClassNames, setCellEditorClassNames] = useState<StyleClassNames>(baseClassName);

    /** An initial flag optimization so when initial is true we set everything at once and not setState multiple times */
    const initial = useRef<boolean>(true);

    useEffect(() => {
        if (initial.current) {
            const fontProps = getFontProperties(props.cellEditor_font_);
            const bgdProps = getColorProperties(props.cellEditor_background_, true);
            const fgdProps = getColorProperties(props.cellEditor_foreground_, false);

            setCellEditorStyle(prevStyle => ({ ...prevStyle, ...fontProps, ...bgdProps.style, ...fgdProps.style }));

            if (props.cellEditor_background_ && props.cellEditor_foreground_) {
                setCellEditorClassNames({ bgdClassName: bgdProps.className, fgdClassName: fgdProps.className });
            }
            else if (props.cellEditor_background_ && !props.cellEditor_foreground_) {
                setCellEditorClassNames(prevState => ({...prevState, bgdClassName: bgdProps.className}));
            }
            else if (!props.cellEditor_background_ && props.cellEditor_foreground_) {
                setCellEditorClassNames(prevState => ({...prevState, fgdClassName: fgdProps.className}));
            }
            
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
            setCellEditorStyle(prevStyle => ({ ...prevStyle, ...bgdProps.style }));
            setCellEditorClassNames(prevState => ({ ...prevState, bgdClassName: bgdProps.className }));
        }
        else if (!initial.current) {
            setCellEditorStyle(prevStyle => ({ ...prevStyle, background: baseStyle.background }));
            setCellEditorClassNames(prevState => ({ ...prevState, bgdClassName: baseClassName.bgdClassName }));
        }
    }, [props.cellEditor_background_]);


    useEffect(() => {
        if (props.cellEditor_foreground_ !== null && !initial.current) {
            const fgdProps = getColorProperties(props.cellEditor_foreground_, false);
            setCellEditorStyle(prevStyle => ({ ...prevStyle, ...fgdProps.style }));
            setCellEditorClassNames(prevState => ({ ...prevState, bgdClassName: fgdProps.className }));
        }
        else if (!initial.current) {
            setCellEditorStyle(prevStyle => ({ ...prevStyle, background: baseStyle.color }));
            setCellEditorClassNames(prevState => ({ ...prevState, fgdClassName: baseClassName.fgdClassName }));
        }
    }, [props.cellEditor_foreground_]);

    return [cellEditorStyle, cellEditorClassNames]
}
export default useCellEditorStyle;