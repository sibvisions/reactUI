import React from "react";
import UIPanel from "../component/dynamic/UIPanel";
import UILabel from "../component/dynamic/UILabel";
import UIEditor from "../component/dynamic/UIEditor";
import UISplitPanel from "../component/dynamic/UISplitPanel";

import { Button } from "primereact/button";

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
        if(toExecute) {return toExecute.method(component)} else {return undefined}
    }

    // Components
    panel(panelData){
        return <UIPanel key={panelData.id} constraints={panelData.constraints} subjects={panelData.subjects} id={panelData.id}/>
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
        return <UISplitPanel subjects={splitPanelData.subjects}/>
    }
}
export default UiBuilder