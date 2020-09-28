import BaseComponent from "../components/BaseComponent";
import React, {FC} from "react"
import UIPanel, {Panel} from "../components/panels/panel/UIPanel";
import UIButton, {buttonProps} from "../components/buttons/button/UIButton";
import UILabel, {uiLabel} from "../components/label/UILabel";
import Dummy from "../components/dummy";
import UIEditorImage, {IEditorImage} from "../components/editors/image/UIEditorImage";
import {IEditor} from "../components/editors/IEditor";
import UIEditorText, {IEditorText} from "../components/editors/text/UIEditorText";
import UISplitPanel, {UISplitPanelProps} from "../components/panels/split/UISplitPanel";

export const createPanel: FC<Panel> = (props) => {
    return <UIPanel isVisible={true} {...props} key={props.id}/>
}

export const createSplitPanel: FC<UISplitPanelProps> = (props) => {
    return <UISplitPanel isVisible={true} {...props} />
}

export const createButton: FC<buttonProps> = (props) => {
    return <UIButton isVisible={true} {...props} key={props.id}/>
}

export const createLabel: FC<uiLabel> = (props) => {
    return <UILabel isVisible={true} {...props} key={props.id}/>
}

export const createDummy: FC<BaseComponent> = (props) => {
    return <Dummy isVisible={true} {...props} key={props.id}/>
}

export const createEditorImage: FC<IEditorImage> = (props) => {
    return <UIEditorImage isVisible={true} {...props} key={props.id} />
}

export const createEditorText: FC<IEditorText> = (props) => {
    return <UIEditorText isVisible={true} {...props} key={props.id}/>
}

const createEditor: FC<IEditor> = ( props ) => {
    if(props.cellEditor){
        if(props.cellEditor.className === "ImageViewer"){
            return createEditorImage((props as IEditorImage));
        }
         if(props.cellEditor.className === "TextCellEditor" || props.cellEditor.className === "NumberCellEditor"){
            return createEditorText((props as IEditorText));
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
    .set("Label", createLabel)
    .set("Editor", createEditor)

export const componentHandler = (component: BaseComponent) => {
    const builder = classNameMapper.get(component.className);
    if(builder){
        return builder(component);
    } else {
        return createDummy(component)
    }
}