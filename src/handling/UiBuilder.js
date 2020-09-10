import { createPanel,
         createTable, 
         createButton, 
         createLabel, 
         createEditor, 
         createGroupPanel,
         createSplitPanel, 
         createCheckBox,
         createTextArea,
         createPassword,
         createTextField,
         createIcon} from "../component/factories/ComponentFactory";

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
            name:"ToggleButton",
            method: this.button.bind(this)
        },
        {
            name:"PopupMenuButton",
            method: this.button.bind(this)
        },
        {
            name:"RadioButton",
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
            method: this.groupPanel.bind(this)
        },
        {
            name:"ScrollPanel",
            method: this.panel.bind(this)
        },
        {
            name:"CheckBox",
            method: this.checkBox.bind(this)
        },
        {
            name:"TextArea",
            method: this.textArea.bind(this)
        },
        {
            name:"PasswordField",
            method: this.passwordField.bind(this)
        },
        {
            name:"TextField",
            method: this.textField.bind(this)
        },
        {
            name:"Icon",
            method: this.icon.bind(this)
        }
    ]

    // Setters
    setServerCommunicator(serverComnicator) {
        this.serverCommunicator = serverComnicator
    }

    // Component Handling
    componentHandler(component) {
        let toExecute = this.genericComponentMapper.find(mapper => mapper.name === component.className)
        if (toExecute) { return toExecute.method(component) } else { return undefined }
    }

    // Components
    panel(panelData) {
        return createPanel(panelData);
    }

    groupPanel(groupPanelData) {
        return createGroupPanel(groupPanelData)
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

    checkBox(checkBoxData){
        return createCheckBox(checkBoxData);
    }

    textField(textFieldData) {
        return createTextField(textFieldData)
    }

    textArea(textAreaData) {
        return createTextArea(textAreaData);
    }

    passwordField(passwordData) {
        return createPassword(passwordData);
    }

    icon(iconData) {
        return createIcon(iconData);
    }
}
export default UiBuilder