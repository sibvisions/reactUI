import React from "react";
import UIPanel from "./components/dynamic/UIPanel";
import UILabel from "./components/dynamic/UILabel";
import { Button } from "primereact/button";
import UIEditor from "./components/dynamic/UIEditor";
import UISplitPanel from "./components/dynamic/UISplitPanel";

class UiBuilder{
    serverCommunicater = {};

    genericComponentMapper = 
    [
        {
            name:"Panel",
            method: this.panel.bind(this)
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
        if(toExecute) {return toExecute.method(component)} else {console.log(component); return undefined}
    }

    // Components
    panel(panelData){
        return <UIPanel key={panelData.id} subjects={panelData.subjects} id={panelData.id}/>
    }

    button(buttonData){
        return <Button key={buttonData.id} label={buttonData.text} onClick={() => this.serverCommunicator.pressButton(buttonData.name)} />
    }

    label(labelData){
        return <UILabel text={labelData.text} />
    }

    editor(editorData){
        return <UIEditor />
    }

    splitPanel(splitPanelData){
        return <UISplitPanel />
    }
}
export default UiBuilder