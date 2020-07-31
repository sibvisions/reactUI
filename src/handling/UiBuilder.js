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
        },
        {
            name:"GroupPanel",
            method: this.panel.bind(this)
        },
        {
            name:"ScrollPanel",
            method: this.panel.bind(this)
        }
    ]

    // Setters
    setServerCommunicator(serverComnicator) {
        this.serverCommunicator = serverComnicator
    }

    // Component Handling
    compontentHandler(component) {
        let toExecute = this.genericComponentMapper.find(mapper => mapper.name === component.className)
        if (toExecute) { return toExecute.method(component) } else { return undefined }
    }

    // Components
    panel(panelData) {
        return createPanel(panelData);
    }

    table(tableData) {
        return createTable(tableData);
    }

    button(buttonData) {
        return createButton(buttonData)
    }

    label(labelData) {
        return createLabel(labelData)
    }

    editor(editorData){
        return createEditor(editorData)
    }

    splitPanel(splitPanelData){
        return createSplitPanel(splitPanelData)
    }

    
}
export default UiBuilder