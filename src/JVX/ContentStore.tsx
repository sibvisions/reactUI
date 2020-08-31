import MenuResponse from "./response/MenuResponse";
import {ReplaySubject} from "rxjs";
import MenuItemCustom from "../primeExtension/MenuItemCustom";
import BaseComponent from "./components/BaseComponent";

class ContentStore{
    menuSubject = new ReplaySubject<Array<MenuItemCustom>>(1)

    flatContent = Array<BaseComponent>();
    removedContent = Array<BaseComponent>();


    updateContent(componentsToUpdate: Array<BaseComponent>){
        componentsToUpdate.forEach(newComponent => {
            let existingComponent;
            existingComponent = this.removedContent.findIndex(oldEl => oldEl.id === newComponent.id)
            if(existingComponent !== -1){
                const reAddedComponent =  this.removedContent.splice(existingComponent,1);
                this.flatContent.push(reAddedComponent[0]);
            }
            existingComponent = this.flatContent.find(oldEl => oldEl.id === newComponent.id)
            if(existingComponent){
                if(newComponent["~destroy"]){
                    //Delete Component From flatContent
                    let indexToDelete = this.flatContent.findIndex(component => component.id === newComponent.id);
                    if(indexToDelete !== -1) this.flatContent.splice(indexToDelete, 1);
                }
                else if (newComponent["~remove"]){
                    //Move Component to removedContent
                    let indexToRemove = this.flatContent.findIndex(component => component.id === newComponent.id);
                    if(indexToRemove !== -1) {
                        let removedElem = this.flatContent.splice(indexToRemove, 1);
                        this.removedContent.push(removedElem[0]);
                    }
                }
                else {
                    for(let newPropName in newComponent){
                            // @ts-ignore
                            existingComponent[newPropName] = newComponent[newPropName]
                    }
                }
            } else this.flatContent.push(newComponent)
        });
    }

    buildMenuBar(menuResponse: MenuResponse){
        let groupsString= Array<string>();
        let groups = Array<MenuItemCustom>();
        //Make out distinct groups
        menuResponse.items.forEach(parent => {
            if(groupsString.indexOf(parent.group) === -1) {
                groupsString.push(parent.group)
                groups.push({label: parent.group, items: Array<MenuItemCustom>(), icon: "pi pi-google"})
            }
        });
        //Add SubMenus to parents
        groups.forEach(parent => {
            menuResponse.items.forEach(subMenu => {
                if(parent.label===subMenu.group) {
                    const item:MenuItemCustom = {
                        label: subMenu.action.label,
                        componentId: subMenu.action.componentId
                    }

                    // @ts-ignore
                    parent.items.push(item);
                }
            });
        });
        this.menuSubject.next(groups);
    }
}
export default ContentStore