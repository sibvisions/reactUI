import React from "react";
import UIPanel from "./components/dynamic/UIPanel";
import { Button } from "primereact/button";

class UiBuilder{
    serverCommunicater = {};

    genericComponentMapper = 
    [
        {
            name:"Panel",
            method: this.panel
        },
        {
            name:"Button",
            method: this.button
        }
    ]

    // Setters
    setServerCommunicator(serverComnicator){
        this.serverCommunicator = serverComnicator
    }

    setContentSafe(contentSafe){
        this.contentSafe = contentSafe
    }

    // Component Handling
    compontentHandler(component){
        let toExecute =this.genericComponentMapper.find(mapper => mapper.name === component.className)
        if(toExecute) {return toExecute.method(component, this)} else {console.log(component); return undefined}
    }

    // Components
    panel(panelData){
        return <UIPanel subjects={panelData.subjects} id={panelData.id}/>
    }

    button(buttonData, thisRef){
        return <Button label={buttonData.text} onClick={() => thisRef.serverCommunicator.pressButton(buttonData.name)} />
    }
}
export default UiBuilder