import React from 'react';
import UIButton from "../dynamic/UIButton";
import UIPanel from "../dynamic/UIPanel";
import UITable from '../dynamic/UITable';
import UILabel from '../dynamic/UILabel';
import UIEditor from '../dynamic/UIEditor';
import UISplitPanel from '../dynamic/UISplitPanel';
import { Size } from '../helper/Size';
import { toPx } from '../helper/ToPx';


export function createButton(id, label, constraints, preferredSize, minimumSize, maximumSize, name, serverCommunicator){

    let btn = <UIButton
        key={id}
        id={id}
        label={label}
        constraints={constraints}
        preferredSize={preferredSize}
        minimumSize={minimumSize}
        maximumSize={maximumSize}
        onClick={() => serverCommunicator.pressButton(name)}
        style={{}}
    />

    //ToDo getPreferredSize etc in all Layouts for components
    if(preferredSize !== undefined) {
        let extrPreferredSize = new Size(undefined, undefined, preferredSize)
        btn.props.style.width = toPx(extrPreferredSize.getWidth())
        btn.props.style.height = toPx(extrPreferredSize.getHeight())
    }
    return btn
}

export function createPanel(id, subjects, screenTitle, layout, layoutData, constraints, preferredSize, minimumSize, maximumSize){
    return  <UIPanel 
        key={id}
        id={id}
        subjects={subjects}
        screenTitle={screenTitle}
        layout={layout}
        layoutData={layoutData}
        constraints={constraints}
        preferredSize={preferredSize}
        minimumSize={minimumSize}
        maximumSize={maximumSize}/>
}

export function createTable(id, columnLabels, columnNames, constraints, dataProvider, preferredSize, minimumSize, maximumSize) {
    return <UITable 
        key={id} 
        id={id}
        columnLabels={columnLabels}
        columnNames={columnNames} 
        constraints={constraints}
        dataProvider={dataProvider}
        preferredSize={preferredSize}
        minimumSize={minimumSize}
        maximumSize={maximumSize}/>
}

export function createLabel(id, text, constraints, preferredSize, minimumSize, maximumSize) {
    return <UILabel
        key={id}
        id={id}
        text={text}
        constraints={constraints}
        preferredSize={preferredSize}
        minimumSize={minimumSize}
        maximumSize={maximumSize}/>
}

export function createEditor(id, constraints, preferredSize, minimumSize, maximumSize) {
    return <UIEditor
        key={id}
        id={id}
        constraints={constraints}
        preferredSize={preferredSize}
        minimumSize={minimumSize}
        maximumSize={maximumSize}/>
}

export function createSplitPanel(id, constraints, subjects, preferredSize, minimumSize, maximumSize) {
    return <UISplitPanel
        key={id}
        id={id}
        constraints={constraints}
        subjects={subjects}
        preferredSize={preferredSize}
        minimumSize={minimumSize}
        maximumSize={maximumSize}/>
}