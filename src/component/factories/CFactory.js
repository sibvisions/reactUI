import React from 'react';
import { Button } from "primereact/button";
import UIPanel from "../dynamic/UIPanel";
import UITable from '../dynamic/UITable';
import UILabel from '../dynamic/UILabel';
import UISplitPanel from '../dynamic/UISplitPanel';
import UIEditorCheckbox from '../dynamic/editors/checkbox/UIEditorCheckbox';
import UIEditorNumber from '../dynamic/editors/number/UIEditorNumber';
import UIEditorText from '../dynamic/editors/text/UIEditorText';
import UIEditorLinked from '../dynamic/editors/linked/UIEditorLinked';


export function createButton(id, label, constraints, name, serverCommunicator){
    return <Button 
        key={id} 
        id={id} 
        label={label}
        constraints={constraints}
        onClick={() => serverCommunicator.pressButton(name)} />
}

export function createPanel(id, subjects, screenTitle, layout, layoutData, constraints){
    return  <UIPanel 
        key={id}
        id={id}
        subjects={subjects}
        screenTitle={screenTitle}
        layout={layout}
        layoutData={layoutData}
        constraints={constraints}/>
}

export function createTable(id, columnLabels, columnNames, constraints, dataProvider, maximumSize) {
    return <UITable 
        key={id} 
        id={id}
        columnLabels={columnLabels}
        columnNames={columnNames} 
        constraints={constraints}
        dataProvider={dataProvider}
        maximumSize={maximumSize}/>
}

export function createLabel(id, text, constraints) {
    return <UILabel
        key={id}
        id={id}
        text={text}
        constraints={constraints}/>
}

export function createEditor(editorData) {
    if(editorData.cellEditor.className === "CheckBoxCellEditor"){
        return <UIEditorCheckbox data={editorData}/>
    } else if(editorData.cellEditor.className === "NumberCellEditor"){
        return <UIEditorNumber data={editorData} />
    } else if(editorData.cellEditor.className === "TextCellEditor"){
        return <UIEditorText data={editorData}/>
    } else if(editorData.cellEditor.className === "LinkedCellEditor"){
        return <UIEditorLinked data={editorData}/>
    }
}

export function createSplitPanel(id, constraints, subjects) {
    return <UISplitPanel
        key={id}
        id={id}
        constraints={constraints}
        subjects={subjects}/>
}