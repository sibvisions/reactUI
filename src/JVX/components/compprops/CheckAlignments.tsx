import BaseComponent from "../BaseComponent";
import { IEditor } from "../editors/IEditor";
import { HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT } from "../layouts/models/ALIGNMENT";

function translateAlignments(pha:number, pva:number) {
    let ha:string = "flex-start";
    let va:string = "flex-start";

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
        else
            return translateAlignments(0, 0);
    }
}

export function checkAlignments(props:BaseComponent) {
    let compType:string = "lbl";

    if (props.className.includes('Button') && props.className !== "RadioButton")
        compType = 'btn';
    else if (props.className === "RadioButton" || props.className === "CheckBox")
        compType = 'rbtn'
    else if (props.className.includes('Label'))
        compType = 'lbl';

    if (props.horizontalAlignment !== undefined && props.verticalAlignment !== undefined)
        return translateAlignments(props.horizontalAlignment, props.verticalAlignment);
    else if (props.horizontalAlignment !== undefined) {
        if (compType === 'btn' || compType === 'rbtn')
            return translateAlignments(props.horizontalAlignment, 1);
        else if (compType === 'lbl')
            return translateAlignments(props.horizontalAlignment, 0);
    }
    else if (props.verticalAlignment !== undefined) {
        if (compType === 'btn')
            return translateAlignments(1, props.verticalAlignment);
        else if (compType === 'lbl' || compType === 'rbtn')
            return translateAlignments(0, props.verticalAlignment);
    }
    else {
        if (compType === 'lbl')
            return translateAlignments(0, 0);
        else if (compType === 'rbtn')
            return translateAlignments(0, 1);
        else if (compType === 'btn')
            return translateAlignments(1, 1);
    }
}