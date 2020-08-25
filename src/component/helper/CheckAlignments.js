export function checkCellEditorAlignments(props) {
    if (props["cellEditor.horizontalAlignment"] !== undefined && props["cellEditor.verticalAlignment"] !== undefined) {
        return {ha: translateAlignments(props["cellEditor.horizontalAlignment"], 'h'), va: translateAlignments(props["cellEditor.verticalAlignment"], 'v')};
    }
    else if (props["cellEditor.horizontalAlignment"] !== undefined) {
        return {ha: translateAlignments(props["cellEditor.horizontalAlignment"], 'h'), va: translateAlignments(props.cellEditor.verticalAlignment, 'v')};
    }
    else if (props["cellEditor.verticalAlignment"] !== undefined) {
        return {ha: translateAlignments(props.cellEditor.horizontalAlignment, 'h'), va: translateAlignments(props["cellEditor.verticalAlignment"], 'v')};
    }
    else {
        return {ha: translateAlignments(props.cellEditor.horizontalAlignment, 'h'), va: translateAlignments(props.cellEditor.verticalAlignment, 'v')}
    }
}

export function checkAlignments(props) {
    if (props.horizontalAlignment !== undefined && props.verticalAlignment !== undefined) {
        return {ha: translateAlignments(props.horizontalAlignment, 'h'), va: translateAlignments(props.verticalAlignment, 'v')};
    }
    else if (props.horizontalAlignment !== undefined) {
        return {ha : translateAlignments(props.horizontalAlignment, 'h'), va: translateAlignments(0, 'v')};
    }
    else if (props.verticalAlignment !== undefined) {
        return {ha: translateAlignments(0, 'h'), va: translateAlignments(props.verticalAlignment, 'v')};
    }
    else {
        if (props.className === 'Label') {
            return {ha: translateAlignments(0, 'h'), va: translateAlignments(0, 'v')}
        }
        else if (props.className === 'Button' || props.className === 'ToggleButton' || props.className === 'PopupMenuButton') {
            return {ha: translateAlignments(1, 'h'), va: translateAlignments(1, 'v')}
        }
        
    }
}

export function checkFlowAlignments(alignArray) {
    return {ha: translateAlignments(parseInt(alignArray[0]), 'h'), va: translateAlignments(parseInt(alignArray[1]), 'v'), ca: translateAlignments(parseInt(alignArray[2]), 'h')}
}

export function checkFormAlignments(alignArray) {
    return {ha: translateAlignments(parseInt(alignArray[0]), 'h'), va: translateAlignments(parseInt(alignArray[1]), 'v')}
}

function translateAlignments(alignment, hv) {
    if (alignment === 1) {
        return "center";
    }
    else if (alignment === 3) {
        return "stretch"
    }
    else if (hv === 'h') {
        if (alignment === 0) {
            return "left"
        }
        else if (alignment === 2) {
            return "right"
        }
    }
    else if (hv === 'v') {
        if (alignment === 0) {
            return "top"
        }
        else if (alignment === 2) {
            return "bottom"
        }
    }
}

export function mapFlex(alignObj) {
    for (const [key, value] of Object.entries(alignObj)) {
        if (value === 'left' || value === 'top') {
            alignObj[key] = 'flex-start'
        }
        else if (value === 'right' || value === 'bottom') {
            alignObj[key] = 'flex-end'
        }
    }
    return alignObj
}