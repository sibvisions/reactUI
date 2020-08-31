import BaseComponent from "../components/BaseComponent";
import React, {FC} from "react"
import UIPanel, {panel} from "../components/panels/panel/UIPanel";
import UIButton, {buttonProps} from "../components/buttons/button/UIButton";

export const createPanel: FC<panel> = (props) => {
    return <UIPanel {...props} key={props.id}/>
}

export const createButton: FC<buttonProps> = (props) => {
    return <UIButton {...props} key={props.id} isVisible={true}/>
}


const classNameMapper = new Map<string, Function>()
    .set("Panel", createPanel)
    .set("GroupPanel", createPanel)
    .set("SplitPanel", createPanel)
    .set("ScrollPanel", createPanel)
    .set("Button", createButton)

export const componentHandler = (component: BaseComponent) => {
    const builder = classNameMapper.get(component.className);
    if(builder){
        return builder(component);
    }
    return undefined;
}