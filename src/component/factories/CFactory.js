import React from 'react';
import { Button } from "primereact/button";
import NPanel from "../responseObj/NPanel";
import NTable from '../responseObj/NTable';


export function createButton(pid, id, label, componentId, onClick){
    return <Button 
        key={id} 
        id={id} 
        pid={pid} 
        componentid={componentId} 
        label={label} 
        onClick={onClick} />
}

export function createPanel(id, pid, componentId, children, screenTitle, layout, layoutData, constraints){
    return  <NPanel 
        key={id}
        id={id}
        pid={pid}
        componentid={componentId}
        children={children}
        screenTitle={screenTitle}
        layout={layout}
        layoutData={layoutData}
        constrains={constraints}/>
}

export function createTable(id, pid, columnLabels, columnNames, dataProvider, maximumSize) {
    return <NTable 
        key={id} 
        id={id} 
        pid={pid} 
        columnNames={columnNames} 
        columnLabels={columnLabels}
        dataProvider={dataProvider}
        maximumSize={maximumSize}/>
}