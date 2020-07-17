import React from "react";
import UILabel from "../component/dynamic/UILabel";
import UIEditor from "../component/dynamic/UIEditor";
import UISplitPanel from "../component/dynamic/UISplitPanel";

import { Button } from "primereact/button";
import { createPanel,
         createTable, 
         createButton, 
         createLabel, 
         createEditor, 
         createSplitPanel } from "../component/factories/CFactory";

class UiBuilder{
    serverCommunicator = {};

    genericComponentMapper = 
    [
        {
            name:"Panel",
            method: this.panel.bind(this)
        },
        {
            name:"Table",
            method: this.table.bind(this)
        },
        {
            name:"Button",
            method: this.button.bind(this)
        },
        {
            name:"Label",
            method: this.label.bind(this)
        },
        {
            name:"Editor",
            method: this.editor.bind(this)
        },
        {
            name:"SplitPanel",
            method: this.splitPanel.bind(this)
        }
    ]

    // Setters
    setServerCommunicator(serverComnicator){
        this.serverCommunicator = serverComnicator
    }
    
    // Component Handling
    compontentHandler(component){
        let toExecute =this.genericComponentMapper.find(mapper => mapper.name === component.className)
        if(toExecute) {return toExecute.method(component)} else {return undefined}
    }

    // Components
    panel(panelData){
        let result = { ...panelData };
        Object.keys(result).map((key) => {
            if (key === "screen.title") {
                result.screenTitle = result[key];
                delete result[key];
            }
        });
        return createPanel(panelData.id, panelData.subjects, result.screenTitle, panelData.layout, panelData.layoutData, panelData.constraints);
    }

    table(tableData){
        return createTable(tableData.id, tableData.columnLabels, tableData.columnNames, tableData.constraints, tableData.dataProvider, tableData.maximumSize);
    }

    button(buttonData){
        return createButton(buttonData.id, buttonData.text, buttonData.constraints, buttonData.name, this.serverCommunicator)
    }

    label(labelData){
        return createLabel(labelData.id, labelData.text, labelData.constraints)
    }

    editor(editorData){
        return createEditor(editorData.id, editorData.constraints)
    }

    splitPanel(splitPanelData){
        return createSplitPanel(splitPanelData.id, splitPanelData.constraints, splitPanelData.subjects)
    }

}
export default UiBuilder