import React from 'react';
import { Button } from "primereact/button";
import UIPanel from "../dynamic/UIPanel";
import UITable from '../dynamic/UITable';
import UILabel from '../dynamic/UILabel';
import UIEditor from '../dynamic/UIEditor';
import UISplitPanel from '../dynamic/UISplitPanel';


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

export function createEditor(id, constraints) {
    return <UIEditor
        key={id}
        id={id}
        constraints={constraints} />
}

export function createSplitPanel(id, constraints, subjects) {
    return <UISplitPanel
        key={id}
        id={id}
        constraints={constraints}
        subjects={subjects}/>
}