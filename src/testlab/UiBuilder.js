import { Subject } from "rxjs";
import ContentSafe from "./ContentSafe";
import React from "react";
import UIPanel from "./components/dynamic/UIPanel";
import { Button } from "primereact/button";

class UiBuilder{
    activeWindow = {};
    btnPressedClass = {};

    menuSubject = new Subject();
    contentEvent = new Subject();
    contentSafe = new ContentSafe();

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

    constructor(activeWindow){
        this.setActiveWindow(activeWindow);
    }

    // Emit events
    emitMenuChange(newMenu){
        this.menuSubject.next(newMenu);
    }

    emitContentChanges(updatedContent){
        this.contentSafe.updateContent(updatedContent)
    }

    // Setters
    setBtnPressClass(toTo){
        this.btnPressedClass = toTo
    }

    // Misc.
    setActiveWindow(reference){
        this.activeWindow = reference;    
    }

    routeFromActiveScreen(route){
        this.activeWindow.props.history.push(route);
    }

    loggedInUser(userData){
        
    }

    buildMenu(unSortedMenuItems){
        let groupsString= [];
        let groups = [];
        //Make out distinct groups
        unSortedMenuItems.items.forEach(parent => {
            if(groupsString.indexOf(parent.group) === -1) {
                groupsString.push(parent.group)
                groups.push({label: parent.group, items: [], key: parent.group})
            }
        });
        //Add SubMenus to parents
        groups.forEach(e => {
            unSortedMenuItems.items.forEach(subMenu => {
                if(e.label===subMenu.group) {
                    e.items.push({
                        label: subMenu.action.label,
                        componentId:subMenu.action.componentId,
                        command: () => this.btnPressedClass.pressButton(subMenu.action.componentId),
                        key:subMenu.action.label})
                }
            });
        });
        this.contentSafe.menuItems = groups;
        this.emitMenuChange(groups)
    }

    // Generic Handler
    genericHandler(genericResponse, activeWindow){
        if(genericResponse.changedComponents !== undefined && genericResponse.changedComponents.length > 0){
            let sortetComponents = [];
            let foundChildren = []
            genericResponse.changedComponents.forEach(parent => {
                parent.subjects = [];
                genericResponse.changedComponents.forEach(child => {
                    if(parent.id === child.parent) {
                        parent.subjects.push(child)
                        foundChildren.push(child)
                    }
                });
                if(!foundChildren.some(x => x === parent)) sortetComponents.push(parent)
            });
            this.emitContentChanges(sortetComponents)
        }
        if(!genericResponse.update){
            this.routeFromActiveScreen("/main/"+genericResponse.componentId)
        }
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
        return <Button label={buttonData.text} onClick={() => thisRef.btnPressedClass.pressButton(buttonData.name)} />
    }
}
export default UiBuilder