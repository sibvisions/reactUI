import { CSSProperties } from "react";
import BaseComponent from "../BaseComponent";
import { IEditor } from "../editors";
import { HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT } from "../layouts";

// Alignment interface with horizontal und vertical alignment
export interface Alignments {
    ha?: string,
    va?: string
}

/**
 * Translates the server sent number alignments into flexbox alignments
 * @param pha - server sent horizontal alignment
 * @param pva - server sent vertical alignment
 * @returns Alignments in flexbox alignment strings
 */
function translateAlignments(pha:number|undefined, pva:number|undefined):Alignments {
    let ha:string|undefined;
    let va:string|undefined;

    if (pha === HORIZONTAL_ALIGNMENT.LEFT) {
        ha = "flex-start";
    }
    else if (pha === HORIZONTAL_ALIGNMENT.CENTER) {
        ha = "center";
    }
    else if (pha === HORIZONTAL_ALIGNMENT.RIGHT) {
        ha = "flex-end";
    }
    else if (pha === HORIZONTAL_ALIGNMENT.STRETCH) {
        ha = "stretch";
    }
        
    if (pva === VERTICAL_ALIGNMENT.TOP) {
        va = "flex-start";
    }
    else if (pva === VERTICAL_ALIGNMENT.CENTER) {
        va = "center";
    }
    else if (pva === VERTICAL_ALIGNMENT.BOTTOM) {
        va = "flex-end";
    }
    else if (pva === VERTICAL_ALIGNMENT.STRETCH) {
        va = "stretch";
    }

    return {ha, va};
}

function isEditor(props:IEditor|BaseComponent): props is IEditor {
    return (props as IEditor).cellEditor !== undefined;
}

/**
 * Returns alignments for CellEditors. cellEditor_ has priority over cellEditor.
 * if there are no Alignments set undefined is returned
 * @param props - Properties of CellEditor
 * @returns Horizontal- and verticalalignment of CellEditor or undefined if none are set
 */
export function getAlignments(props: IEditor|BaseComponent):Alignments {
    if (isEditor(props)) {
        if (props.cellEditor_horizontalAlignment_ !== undefined && props.cellEditor_verticalAlignment_ !== undefined)
            return translateAlignments(props.cellEditor_horizontalAlignment_, props.cellEditor_verticalAlignment_);
        else if (props.cellEditor_horizontalAlignment_ !== undefined && props.cellEditor!.verticalAlignment !== undefined)
            return translateAlignments(props.cellEditor_horizontalAlignment_, props.cellEditor!.verticalAlignment);
        else if (props.cellEditor_verticalAlignment_ !== undefined && props.cellEditor!.horizontalAlignment !== undefined)
            return translateAlignments(props.cellEditor!.horizontalAlignment, props.cellEditor_verticalAlignment_);
        else if (props.cellEditor!.horizontalAlignment !== undefined && props.cellEditor!.verticalAlignment !== undefined)
            return translateAlignments(props.cellEditor!.horizontalAlignment, props.cellEditor!.verticalAlignment);
        else
            return translateAlignments(undefined, undefined);
    }
    else {
        if (props.horizontalAlignment !== undefined && props.verticalAlignment !== undefined)
            return translateAlignments(props.horizontalAlignment, props.verticalAlignment);
        else if (props.horizontalAlignment !== undefined) 
            return translateAlignments(props.horizontalAlignment, undefined);
        else if (props.verticalAlignment !== undefined)
            return translateAlignments(undefined, props.verticalAlignment);
        else
            return translateAlignments(undefined, undefined);
    }
}

/**
 * Returns the translated text-alignment of a component
 * @param pha - the horizontal alignment of a component
 */
export function translateTextAlign(pha:number|undefined): CSSProperties {
    if (pha === HORIZONTAL_ALIGNMENT.LEFT)
        return {textAlign: "left"};
    else if (pha === HORIZONTAL_ALIGNMENT.CENTER)
        return {textAlign: "center"};
    else if (pha === HORIZONTAL_ALIGNMENT.RIGHT)
        return {textAlign: "right"};
    else
        return {}
}

/**
 * Checks the horizontal alignment of a component and then calls the translateTextAlign function to get the correct text-alignment.
 * @param props - properties of an editor 
 */
export function getTextAlignment(props: IEditor) {
    if (props.cellEditor) {
        if (props.cellEditor_horizontalAlignment_ !== undefined) 
            return translateTextAlign(props.cellEditor_horizontalAlignment_);
        else if (props.cellEditor.horizontalAlignment !== undefined)
            return translateTextAlign(props.cellEditor.horizontalAlignment);
        else
            return translateTextAlign(undefined);
    }
}