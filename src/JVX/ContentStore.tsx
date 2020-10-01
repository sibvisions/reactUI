import MenuResponse from "./response/MenuResponse";
import {ReplaySubject, Subject} from "rxjs";
import MenuItemCustom from "../primeExtension/MenuItemCustom";
import BaseComponent from "./components/BaseComponent";
import UserData from "./model/UserData";

class ContentStore{

    menuSubject = new ReplaySubject<Array<MenuItemCustom>>(1)
    flatContent = new Map<string ,BaseComponent>();
    removedContent = new Map<string ,BaseComponent>();

    currentUser: UserData = new UserData();

    //Sub Maps
    propertiesSubscriber = new Map<string, Function>();
    parentSubscriber = new Map<string, Function>();

    updateContent(componentsToUpdate: Array<BaseComponent>){
        const notifyList = new Array<string>();
        //Update FlatContent
        componentsToUpdate.forEach(newComponent => {
            //Check if component was removed earlier, if yes then re-add it to flatContent
            let existingComponent = this.removedContent.get(newComponent.id);
            if(existingComponent){
                this.removedContent.delete(existingComponent.id);
                this.flatContent.set(existingComponent.id, existingComponent);
            }



            //Update existing component
            existingComponent = this.flatContent.get(newComponent.id);

            if(newComponent.parent && existingComponent){
                notifyList.push(existingComponent.id)
                notifyList.push(newComponent.parent);
            }

            if(existingComponent){
                if(newComponent["~destroy"]){
                    //Delete Component From flatContent
                    const componentToRemove = this.flatContent.get(newComponent.id);
                    if(componentToRemove) {
                        this.flatContent.delete(componentToRemove.id);
                    }
                }
                else if (newComponent["~remove"]){
                    //Move Component to removedContent
                    const componentToRemove = this.flatContent.get(newComponent.id);
                    if(componentToRemove) {
                        this.flatContent.delete(componentToRemove.id);
                        this.removedContent.set(componentToRemove.id, componentToRemove);
                    }
                }
                else {
                    //Update or set properties
                    for(let newPropName in newComponent){
                        // @ts-ignore
                        existingComponent[newPropName] = newComponent[newPropName]

                    }
                }
            }
            else {
                this.flatContent.set(newComponent.id, newComponent);
            }
        });


        //Notify active components
        componentsToUpdate.forEach(value => {
            const existingComp = this.flatContent.get(value.id);
            const updateFunction = this.propertiesSubscriber.get(value.id);
            if(existingComp && updateFunction){
                updateFunction(existingComp);
            }
        });

        notifyList.forEach(value => {
           this.parentSubscriber.get(value)?.();
        });
    }

    subscribeToPropChange(id: string, fn: Function){
        this.propertiesSubscriber.set(id, fn);
    }

    subscribeToParentChange(id: string, fn: Function){
        this.parentSubscriber.set(id, fn);
    }

    unsubscribeFromParentChange(id: string){
        this.parentSubscriber.delete(id);
    }

    unsubscribeFromPropChange(id: string){
        this.propertiesSubscriber.delete(id);
    }

    getWindow(windowName: string): BaseComponent | undefined{
        const componentEntries = this.flatContent.entries();

        let entry = componentEntries.next();
        while(!entry.done){
            if(entry.value[1].name === windowName){
                return entry.value[1];
            }
            entry = componentEntries.next();
        }
        return undefined;
    }

    getChildren(parentId: string): Array<BaseComponent>{
        const componentEntries = this.flatContent.entries();
        const children = new Array<BaseComponent>();

        let entry = componentEntries.next();
        while (!entry.done){
            if(entry.value[1].parent === parentId){
                children.push(entry.value[1]);
            }
            entry = componentEntries.next();
        }
        return children;
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

    closeScreen(windowName: string){
        const deleteChildren = (parentId: string) => {
            const children = this.getChildren(parentId);

            children.forEach(child => {
               deleteChildren(child.id);
               this.flatContent.delete(child.id);
            });
        }

        const window = this.getWindow(windowName);
        if(window){
            deleteChildren(window.id);
            this.flatContent.delete(window.id);
        }
    }
}
export default ContentStore