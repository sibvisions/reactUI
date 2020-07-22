import React from 'react';
import UIButton from "../dynamic/UIButton";
import UIPanel from "../dynamic/UIPanel";
import UITable from '../dynamic/UITable';
import UILabel from '../dynamic/UILabel';
import UIEditor from '../dynamic/UIEditor';
import UISplitPanel from '../dynamic/UISplitPanel';
import { Size } from '../helper/Size';
import { toPx } from '../helper/ToPx';


export function createButton(id, label, constraints, pPreferredSize, name, serverCommunicator){

    let btn = <UIButton
        key={id}
        id={id}
        label={label}
        constraints={constraints}
        preferredSize={pPreferredSize}
        onClick={() => serverCommunicator.pressButton(name)}
        style={{}}
    />

    let preferredSize
    if(pPreferredSize !== undefined) {
        preferredSize = new Size(undefined, undefined, pPreferredSize)
        btn.props.style.width = toPx(preferredSize.getWidth())
        btn.props.style.height = toPx(preferredSize.getHeight())
    }
    return btn
}

export function createPanel(id, subjects, screenTitle, layout, layoutData, constraints, preferredSize){
    return  <UIPanel 
        key={id}
        id={id}
        subjects={subjects}
        screenTitle={screenTitle}
        layout={layout}
        layoutData={layoutData}
        constraints={constraints}
        preferredSize={preferredSize}/>
}

export function createTable(id, columnLabels, columnNames, constraints, dataProvider, preferredSize, maximumSize) {
    return <UITable 
        key={id} 
        id={id}
        columnLabels={columnLabels}
        columnNames={columnNames} 
        constraints={constraints}
        dataProvider={dataProvider}
        preferredSize={preferredSize}
        maximumSize={maximumSize}/>
}

export function createLabel(id, text, constraints, preferredSize) {
    return <UILabel
        key={id}
        id={id}
        text={text}
        constraints={constraints}
        preferredSize={preferredSize}/>
}

export function createEditor(id, constraints, preferredSize) {
    return <UIEditor
        key={id}
        id={id}
        constraints={constraints}
        preferredSize={preferredSize}/>
}

export function createSplitPanel(id, constraints, subjects, preferredSize) {
    return <UISplitPanel
        key={id}
        id={id}
        constraints={constraints}
        subjects={subjects}
        preferredSize={preferredSize}/>
}