import BaseComponent from "../BaseComponent";
import { IEditor } from "../editors/IEditor";
import { HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT } from "../layouts/models/ALIGNMENT";
import Alignments from "./Alignments";

function translateAlignments(pha:number|undefined, pva:number|undefined) {
    let ha:string|undefined;
    let va:string|undefined;

    if (pha === HORIZONTAL_ALIGNMENT.LEFT)
        ha = "flex-start";
    else if (pha === HORIZONTAL_ALIGNMENT.CENTER)
        ha = "center";
    else if (pha === HORIZONTAL_ALIGNMENT.RIGHT)
        ha = "flex-end";
    else if (pha === HORIZONTAL_ALIGNMENT.STRETCH)
        ha = "stretch";

    if (pva === VERTICAL_ALIGNMENT.TOP)
        va = "flex-start";
    else if (pva === VERTICAL_ALIGNMENT.CENTER)
        va = "center";
    else if (pva === VERTICAL_ALIGNMENT.BOTTOM)
        va = "flex-end";
    else if (pva === VERTICAL_ALIGNMENT.STRETCH)
        va = "stretch";
    
    return {ha, va}
}

export function checkCellEditorAlignments(props:IEditor) {
    if (props.cellEditor) {
        if (props.cellEditor_horizontalAlignment_ !== undefined && props.cellEditor_verticalAlignment_ !== undefined)
            return translateAlignments(props.cellEditor_horizontalAlignment_, props.cellEditor_verticalAlignment_);
        else if (props.cellEditor_horizontalAlignment_ !== undefined && props.cellEditor.verticalAlignment !== undefined)
            return translateAlignments(props.cellEditor_horizontalAlignment_, props.cellEditor.verticalAlignment);
        else if (props.cellEditor_verticalAlignment_ !== undefined && props.cellEditor.horizontalAlignment !== undefined)
            return translateAlignments(props.cellEditor.horizontalAlignment, props.cellEditor_verticalAlignment_);
        else if (props.cellEditor.horizontalAlignment !== undefined && props.cellEditor.verticalAlignment !== undefined)
            return translateAlignments(props.cellEditor.horizontalAlignment, props.cellEditor.verticalAlignment);
        else {
            return translateAlignments(undefined, undefined);
        }
            
    }
    else
        return translateAlignments(undefined, undefined)
}

export function checkAlignments(props:BaseComponent):Alignments {
    if (props.horizontalAlignment !== undefined && props.verticalAlignment !== undefined)
        return translateAlignments(props.horizontalAlignment, props.verticalAlignment);
    else if (props.horizontalAlignment !== undefined) {
        return translateAlignments(props.horizontalAlignment, undefined);
    }
    else if (props.verticalAlignment !== undefined) {
        return translateAlignments(undefined, props.verticalAlignment);
    }
    else {
        return translateAlignments(undefined, undefined);
    }
}