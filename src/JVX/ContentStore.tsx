import MenuResponse, {serverMenuButtons} from "./response/MenuResponse";
import {ReplaySubject} from "rxjs";
import MenuItemCustom from "../primeExtension/MenuItemCustom";
import BaseComponent from "./components/BaseComponent";
import UserData from "./model/UserData";
import MetaDataResponse from "./response/MetaDataResponse";
import { parseIconData } from "./components/compprops/ComponentProperties";
import {ReactElement} from "react";
import {componentHandler} from "./factories/UIFactory";

type MenuItem = {
    componentId: string,
    image: string,
    text: string
}

class ContentStore{

    menuSubject = new ReplaySubject<Array<MenuItemCustom>>(1);
    flatContent = new Map<string ,BaseComponent>();
    removedContent = new Map<string ,BaseComponent>();
    customContent = new Map<string, Function>();
    serverMenuItems = new Map<string, Array<serverMenuButtons>>();
    customMenuItems = new Map<string, Array<serverMenuButtons>>();
    mergedMenuItems = new Map<string, Array<serverMenuButtons>>();
    currentUser: UserData = new UserData();

    //Sub Maps
    propertiesSubscriber = new Map<string, Function>();
    parentSubscriber = new Map<string, Function>();
    rowSelectionSubscriber = new Map<string, Array<Function>>();
    rowSelectionIndexSubscriber = new Map<string, Array<Function>>();
    dataChangeSubscriber = new Map<string, Array<{ displayRecords: number, fn: Function }>>();
    appNameSubscriber = new Map<string, Function>();

    MenuSubscriber = new Array<Function>();

    //DataProvider Maps
    dataProviderData = new Map<string, Array<any>>();
    dataProviderMetaData = new Map<string, MetaDataResponse>();
    dataProviderFetched = new Map<string, boolean>();
    dataProviderSelectedRow = new Map<string, any>();
    dataProviderSelectedRowIndex = new Map<string, number>();

    //Content
    updateContent(componentsToUpdate: Array<BaseComponent>){
        const notifyList = new Array<string>();
        let existingComponent: BaseComponent | undefined;

        //check for ReplaceScreens
        const filtered = componentsToUpdate.filter(component => !this.customContent.has(component.name));

        //Update FlatContent
        filtered.forEach(newComponent => {
            existingComponent = this.flatContent.get(newComponent.id) || this.removedContent.get(newComponent.id);

            if(this.removedContent.has(newComponent.id) && existingComponent){
                this.removedContent.delete(newComponent.id);
                this.flatContent.set(newComponent.id, existingComponent)
            }

            //Notify Parent
            if(newComponent.parent || newComponent["~remove"] || newComponent["~destroy"] || newComponent.visible !== undefined || newComponent.constraints){
                notifyList.push(existingComponent?.parent || "");
                if(newComponent.parent){
                    notifyList.push(newComponent.parent);
                }
            }

            if((newComponent["~remove"] || newComponent["~destroy"]) && existingComponent){
                this.flatContent.delete(newComponent.id);
                if(newComponent["~remove"])
                    this.removedContent.set(newComponent.id, existingComponent);
                else
                    this.removedContent.delete(newComponent.id);
            }

            // Add new Component or updated Properties
            if(existingComponent) {
                for (let newPropName in newComponent) {
                    // @ts-ignore
                    existingComponent[newPropName] = newComponent[newPropName]
                }
            } else {
                this.flatContent.set(newComponent.id, newComponent);
            }
        });

        //Properties
        filtered.forEach(value => {
            const existingComp = this.flatContent.get(value.id) || this.removedContent.get(value.id);
            const updateFunction = this.propertiesSubscriber.get(value.id);
            if(existingComp && updateFunction){
                updateFunction(existingComp);
            }
        });
        notifyList.filter(this.onlyUniqueFilter).forEach(parentId => this.parentSubscriber.get(parentId)?.apply(undefined, []));
    }

    onlyUniqueFilter(value: string, index: number, self: Array<string>) {
        return self.indexOf(value) === index;
    }


    closeScreen(windowName: string){
        const deleteChildren = (parentId: string) => {
            const children = this.getChildren(parentId);

            children.forEach(child => {
                deleteChildren(child.id);
                this.flatContent.delete(child.id);
            });
        }

        const window = this.getWindowData(windowName);
        if(window){
            deleteChildren(window.id);
            this.flatContent.delete(window.id);
        }
    }

    reset(){
        this.flatContent.clear();
        this.removedContent.clear();
        this.currentUser = new UserData();
        this.dataProviderData.clear();
        this.dataProviderMetaData.clear();
        this.dataProviderFetched.clear();
        this.dataProviderSelectedRow.clear();
    }


    //Data Provider Management
    updateDataProviderData(dataProvider: string, newDataSet: Array<any>, to: number, from: number){
        const existingData = this.dataProviderData.get(dataProvider);
        if(existingData){
            if(existingData.length <= from){
                existingData.push(...newDataSet)
            } else {
                let newDataSetIndex = 0;
                for(let i = to; i <= from; i++){
                    existingData[i] = newDataSet[newDataSetIndex];
                    newDataSetIndex++;
                }
            }
        }
        else{
            this.dataProviderData.set(dataProvider, newDataSet);
        }

        this.notifyDataChange(dataProvider)
    }

    notifyDataChange(dataProvider: string) {
        //Notify
        this.dataChangeSubscriber.get(dataProvider)?.forEach(value => {
            value.fn.apply(undefined, []);
        });
    }

    getData(dataProvider: string, from?: number, to?: number): Array<any>{
        const dataArray = this.dataProviderData.get(dataProvider);

        if(from !== undefined && to !== undefined){
            return dataArray?.slice(from, to) || [];
        }

        return  dataArray || []
    }

    getDataRow(dataProvider: string, indexOfRow: number) : any{
        const data = this.getData(dataProvider);
        const dataRow = data[indexOfRow];
        if(dataRow)
            return dataRow;
        else
            return undefined
    }

    getSelectedIndex(dataProvider: string) : number{
        return this.dataProviderSelectedRowIndex.get(dataProvider) || -1
    }

    setSelectedRow(dataProvider: string, dataRow: any, index: number){
        this.dataProviderSelectedRow.set(dataProvider, dataRow);
        this.dataProviderSelectedRowIndex.set(dataProvider, index)
    }

    clearSelectedRow(dataProvider: string){
        this.dataProviderSelectedRow.delete(dataProvider);
        this.dataProviderSelectedRowIndex.delete(dataProvider);
    }

    clearDataFromProvider(dataProvider: string){
        this.dataProviderData.delete(dataProvider);
    }


    //Getters
    getWindow(windowName: string): ReactElement{
        const windowData = this.getWindowData(windowName);
        if(windowData)
            return componentHandler(windowData);
        else
            return this.customContent.get(windowName)?.apply(undefined, []);
    }

    getWindowData(windowName: string): BaseComponent | undefined{
        let componentEntries = this.flatContent.entries();
        let entry = componentEntries.next();
        while(!entry.done){
            if(entry.value[1].name === windowName){
                return entry.value[1];
            }
            entry = componentEntries.next();
        }
        return undefined;
    }

    getChildren(parentId: string): Map<string, BaseComponent>{
        const componentEntries = this.flatContent.entries();
        const children = new Map<string, BaseComponent>();
        let entry = componentEntries.next();
        while (!entry.done){
            if(entry.value[1].parent === parentId && entry.value[1].visible !== false){
                children.set(entry.value[1].id, entry.value[1]);
            }
            entry = componentEntries.next();
        }
        return children;
    }


    //Menu

    notifyAppNameChanged(appName:string) {
        this.appNameSubscriber.forEach(subscriber => {
            subscriber.apply(undefined, [appName])
        })
    }

    //Subscription Management
    subscribeToPropChange(id: string, fn: Function){
        this.propertiesSubscriber.set(id, fn);
    }

    subscribeToParentChange(id: string, fn: Function){
        this.parentSubscriber.set(id, fn);
    }

    subscribeToRowSelection(dataProvider: string, fn: Function){
        const subscriber = this.rowSelectionSubscriber.get(dataProvider);
        if(subscriber){
            subscriber.push(fn);
        } else {
            this.rowSelectionSubscriber.set(dataProvider, new Array<Function>(fn));
        }
    }

    subscribeToRowIndexSelection(dataProvider: string, fn: Function){
        const subscriber = this.rowSelectionIndexSubscriber.get(dataProvider);
        const selectedIndex = this.dataProviderSelectedRowIndex.get(dataProvider);
        if(selectedIndex !== undefined)
            fn.apply(undefined, [selectedIndex])
        if(subscriber){
            subscriber.push(fn);
        } else {
            this.rowSelectionIndexSubscriber.set(dataProvider, new Array<Function>(fn));
        }
    }

    subscribeToDataChange(dataProvider: string, fn: Function, displayRecords= 50){
        const subscriber = this.dataChangeSubscriber.get(dataProvider);
        if(subscriber){
            subscriber.push({fn: fn, displayRecords: displayRecords});
        } else {
            this.dataChangeSubscriber.set(dataProvider, new Array<{ displayRecords: number, fn: Function}>({fn: fn, displayRecords: displayRecords}));
        }
    }

    subscribeToAppName(id:string, fn: Function) {
        this.appNameSubscriber.set(id, fn);
    }

    subscribeToMenuChange(fn: Function){
        this.MenuSubscriber.push(fn)
    }


    unsubscribeFromMenuChange(fn: Function){
        this.MenuSubscriber.splice(this.MenuSubscriber.findIndex(value => value === fn), 1);
    }

    unsubscribeFromDataChange(dataProvider: string, fn: Function){
        const subscriber = this.dataChangeSubscriber.get(dataProvider)
        if(subscriber){
            subscriber.splice(subscriber.findIndex(value => value.fn === fn),1);
        }
    }

    unsubscribeFromRowSelection(dataProvider: string, fn: Function){
        const subscriber = this.rowSelectionSubscriber.get(dataProvider)
        if(subscriber){
            subscriber.splice(subscriber.findIndex(value => value === fn),1);
        }
    }

    unsubscribeFromRowIndexSelection(dataProvider: string, fn: Function){
        const subscriber = this.rowSelectionSubscriber.get(dataProvider)
        if(subscriber){
            subscriber.splice(subscriber.findIndex(value => value === fn),1);
        }
    }

    unsubscribeFromParentChange(id: string){
        this.parentSubscriber.delete(id);
    }

    unsubscribeFromPropChange(id: string){
        this.propertiesSubscriber.delete(id);
    }

    unsubscribeFromAppName(id: string) {
        this.appNameSubscriber.delete(id)
    }


    //Events
    emitRowSelect(dataProvider: string){
        const rowSubscriber = this.rowSelectionSubscriber.get(dataProvider);
        const indexSubscriber = this.rowSelectionIndexSubscriber.get(dataProvider);
        const selectedRow = this.dataProviderSelectedRow.get(dataProvider);
        const selectedIndex = this.dataProviderSelectedRowIndex.get(dataProvider);
        if(rowSubscriber)
            rowSubscriber.forEach(sub => {
                sub.apply(undefined, [selectedRow]);
            });
        if(indexSubscriber)
            indexSubscriber.forEach(sub => {
                sub.apply(undefined, [selectedIndex]);
            });
    }

    emitMenuUpdate(){
        this.MenuSubscriber.forEach(subFunction => {
            subFunction.apply(undefined, [this.mergedMenuItems]);
        });
    }

    //Custom Screens

    addMenuItem(menuItem: serverMenuButtons, fromServer:boolean){
        const menuGroup = fromServer ? this.serverMenuItems.get(menuItem.group) : this.customMenuItems.get(menuItem.group);
        if(menuGroup)
            menuGroup.push(menuItem);
        else {
            fromServer ? this.serverMenuItems.set(menuItem.group, [menuItem]) : this.customMenuItems.set(menuItem.group, [menuItem]);
        }
        this.mergeMenuButtons();
    }

    mergeMenuButtons() {
        this.mergedMenuItems = new Map([...this.serverMenuItems, ...this.customMenuItems])
    }

    addCustomScreen(title: string, screenFactory: () => ReactElement){
        this.customContent.set(title, screenFactory);
    }

    registerCustomOfflineScreen(title: string, group: string, screenFactory: () => ReactElement){
        const menuButton: serverMenuButtons = {
            group: group,

            componentId: "",
            image: "someIcon",
            text: "Click Me",
            action: () => {
                window.location.hash = "/home/"+title;
            }
        }

        this.addCustomScreen(title, screenFactory);
        this.addMenuItem(menuButton, false);
    }

    registerReplaceScreen(title: string, screenFactory: () => ReactElement){
        this.customContent.set(title, screenFactory);
    }
}
export default ContentStore