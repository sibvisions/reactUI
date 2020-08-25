import React from 'react';
import UIButton from "../dynamic/buttons/button/UIButton";
import UIPanel from "../dynamic/panels/panel/UIPanel";
import UITable from '../dynamic/table/UITable';
import UILabel from '../dynamic/label/UILabel';
import UIGroupPanel from "../dynamic/panels/grouppanel/UIGroupPanel";
import UISplitPanel from '../dynamic/panels/splitpanel/UISplitPanel';
import UIEditorCheckbox from '../dynamic/editors/checkbox/UIEditorCheckbox';
import UIEditorNumberHooks from '../dynamic/editors/number/UIEditorNumberHooks';
import UIEditorTextHooks from "../dynamic/editors/text/UIEditorTextHooks";
import UIEditorImage from '../dynamic/editors/image/UIEditorImage';
import UICheckBox from '../dynamic/ckeckbox/UICheckBox';
import UIEditorDisabled from '../dynamic/editors/disabled/UIEditorDisabled';
import UIEditorDate from '../dynamic/editors/date/UIEditorDate';
import UIEditorLinkedHooks from '../dynamic/editors/linked/UIEditorLinkedHooks';
import UIMenuButton from '../dynamic/buttons/menubutton/UIMenuButton';


export function createButton(buttonData){
    const props= {
        ...buttonData,
        key: buttonData.id
    }
    if(buttonData.className === "Button" || buttonData.className === "ToggleButton") {
        return <UIButton {...props} />
    }
    else if (buttonData.className === "PopupMenuButton") {
        return <UIMenuButton {...props} />
    }
}

export function createPanel(panelData){
    return  <UIPanel  {...panelData} key={panelData.id} />
}

export function createTable(tableData) {
    return <UITable {...tableData} key={tableData.id} />
}

export function createLabel(labelData) {
    return <UILabel {...labelData} key={labelData.id} />
}

export function createEditor(editorData) {
    const props= {
        ...editorData,
        key: editorData.id
    }

    if(!editorData.cellEditor){
        return <UIEditorDisabled {...props} />
    }

    else if(editorData.cellEditor.className === "CheckBoxCellEditor"){
        return <UIEditorCheckbox {...props}/>
    } else if(editorData.cellEditor.className === "NumberCellEditor"){
        return <UIEditorNumberHooks {...props}/>
    } else if(editorData.cellEditor.className === "TextCellEditor"){
        return <UIEditorTextHooks {...props}/>
    } else if(editorData.cellEditor.className === "LinkedCellEditor"){
        return <UIEditorLinkedHooks {...props}/>
    } else if(editorData.cellEditor.className === "ImageViewer"){
        return <UIEditorImage {...props}/>
    } else if(editorData.cellEditor.className === "DateCellEditor"){
        return <UIEditorDate {...props}/>
    }
}

export function createGroupPanel(groupPanelData) {
    return <UIGroupPanel {...groupPanelData} key={groupPanelData.id}/>
}

export function createSplitPanel(splitPanelData) {
    return <UISplitPanel {...splitPanelData} key={splitPanelData.id}/>
}

export function createCheckBox(checkBoxData){
    return <UICheckBox {...checkBoxData} key={checkBoxData.id}/>
}