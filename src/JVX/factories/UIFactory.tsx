import BaseComponent from "../components/BaseComponent";
import React, {FC} from "react"
import UIPanel, {Panel} from "../components/panels/panel/UIPanel";
import UIButton from "../components/buttons/button/UIButton";
import UILabel, {uiLabel} from "../components/label/UILabel";
import Dummy from "../components/dummy";
import UIEditorImage, {IEditorImage} from "../components/editors/image/UIEditorImage";
import {IEditor} from "../components/editors/IEditor";
import UIEditorText, {IEditorText} from "../components/editors/text/UIEditorText";
import UISplitPanel, {UISplitPanelProps} from "../components/panels/split/UISplitPanel";
import UITable, {TableProps} from "../components/table/UITable";
import UIEditorNumber, {IEditorNumber} from "../components/editors/number/UIEditorNumber";
import UIEditorDate, { IEditorDate } from "../components/editors/date/UIEditorDate";
import UIEditorChoice, { IEditorChoice } from "../components/editors/choice/UIEditorChoice";
import UIEditorCheckbox, { IEditorCheckbox } from "../components/editors/checkbox/UIEditorCheckbox";
import UIEditorLinked, { IEditorLinked } from "../components/editors/linked/UIEditorLinked";
import { IButton } from "../components/buttons/IButton";
import UIToggleButton from "../components/buttons/togglebutton/UIToggleButton";
import UIMenuButton, { IMenuButton } from "../components/buttons/menubutton/UIMenuButton";
import UIRadioButton, { IRadioButton } from "../components/buttons/radiobutton/UIRadioButton";
import UICheckBox, { ICheckBox } from "../components/checkbox/UICheckBox";
import UIIcon from "../components/icon/UIIcon";
import UIText from "../components/text/UIText";
import UITextArea from "../components/text/UITextArea";
import UIPassword from "../components/text/UIPassword";
import UITabsetPanel, { ITabsetPanel } from "../components/panels/tabsetpanel/UITabsetPanel";

export const createPanel: FC<Panel> = (props) => {
    return <UIPanel {...props} key={props.id}/>
}

export const createSplitPanel: FC<UISplitPanelProps> = (props) => {
    return <UISplitPanel {...props} key={props.id}/>
}

export const createButton: FC<IButton> = (props) => {
    return <UIButton {...props} key={props.id}/>
}

export const createToggleButton: FC<IButton> = (props) => {
    return <UIToggleButton {...props} key={props.id}/>
}

export const createPopupMenuButton: FC<IMenuButton> = (props) => {
    return <UIMenuButton {...props} key={props.id}/>
}

export const createRadioButton: FC<IRadioButton> = (props) => {
    return <UIRadioButton {...props} key={props.id}/>
}

export const createCheckBox: FC<ICheckBox> = (props) => {
    return <UICheckBox {...props} key={props.id}/>
}

export const createLabel: FC<uiLabel> = (props) => {
    return <UILabel {...props} key={props.id}/>
}

export const createDummy: FC<BaseComponent> = (props) => {
    return <Dummy {...props} key={props.id}/>
}

export const createEditorImage: FC<IEditorImage> = (props) => {
    return <UIEditorImage {...props} key={props.id} />
}

export const createEditorText: FC<IEditorText> = (props) => {
    return <UIEditorText {...props} key={props.id}/>
}

export const createEditorNumber: FC<IEditorNumber> = (props) => {
    return <UIEditorNumber {...props} key={props.id}/>
}

export const createEditorDate: FC<IEditorDate> = (props) => {
    return <UIEditorDate {...props} key={props.id}/>
}

export const createEditorChoice: FC<IEditorChoice> = (props) => {
    return <UIEditorChoice {...props} key={props.id}/>
}

export const createEditorCheckbox: FC<IEditorCheckbox> = (props) => {
    return <UIEditorCheckbox {...props} key={props.id}/>
}

export const createEditorLinked: FC<IEditorLinked> = (props) => {
    return <UIEditorLinked {...props} key={props.id}/>
}

export const createTable: FC<TableProps> = (props) => {
    return <UITable {...props} key={props.id}/>
}

export const createIcon: FC<BaseComponent> = (props) => {
    return <UIIcon {...props} key={props.id}/>
}

export const createTextField: FC<BaseComponent> = (props) => {
    return <UIText {...props} key={props.id}/>
}

export const createTextArea: FC<BaseComponent> = (props) => {
    return <UITextArea {...props} key={props.id}/>
}

export const createPassword: FC<BaseComponent> = (props) => {
    return <UIPassword {...props} key={props.id}/>
}

export const createTabsetPanel: FC<ITabsetPanel> = (props) => {
    return <UITabsetPanel {...props} key={props.id}/>
}

export const createEditor: FC<IEditor> = ( props ) => {
    if(props.cellEditor){
        if(props.cellEditor.className === "ImageViewer"){
            return createEditorImage((props as IEditorImage));
        }
        else if(props.cellEditor.className === "TextCellEditor"){
            return createEditorText((props as IEditorText));
        }
        else if (props.cellEditor.className === "NumberCellEditor") {
            return createEditorNumber((props as IEditorNumber));
        }
        else if (props.cellEditor.className === "DateCellEditor") {
            return createEditorDate((props as IEditorDate));
        }
        else if (props.cellEditor.className === "ChoiceCellEditor") {
            return createEditorChoice((props as IEditorChoice));
        }
        else if (props.cellEditor.className === "CheckBoxCellEditor") {
            return createEditorCheckbox((props as IEditorCheckbox));
        }
        else if (props.cellEditor.className === "LinkedCellEditor") {
            return createEditorLinked((props as IEditorLinked))
        }
        else{
            return createDummy(props)
        }
    } else {
        return createDummy(props)
    }
}

const classNameMapper = new Map<string, Function>()
    .set("Panel", createPanel)
    .set("GroupPanel", createPanel)
    .set("ScrollPanel", createPanel)
    .set("SplitPanel", createSplitPanel)
    .set("Button", createButton)
    .set("ToggleButton", createToggleButton)
    .set("PopupMenuButton", createPopupMenuButton)
    .set("RadioButton", createRadioButton)
    .set("CheckBox", createCheckBox)
    .set("Label", createLabel)
    .set("Editor", createEditor)
    .set("Table", createTable)
    .set("Icon", createIcon)
    .set("TextField", createTextField)
    .set("TextArea", createTextArea)
    .set("PasswordField", createPassword)
    .set("TabsetPanel", createTabsetPanel)

export const componentHandler = (component: BaseComponent) => {
    const builder = classNameMapper.get(component.className);
    if(builder){
        return builder(component);
    } else {
        return createDummy(component)
    }
}