import {serverMenuButtons} from "./response/MenuResponse";
import {ReplaySubject} from "rxjs";
import MenuItemCustom from "../primeExtension/MenuItemCustom";
import BaseComponent from "./components/BaseComponent";
import UserData from "./model/UserData";
import MetaDataResponse from "./response/MetaDataResponse";
import {ReactElement} from "react";
import {componentHandler} from "./factories/UIFactory";
import {Panel} from './components/panels/panel/UIPanel'

type MenuItem = {
    componentId: string,
    image: string,
    text: string
}

export default class ContentStore{

    menuSubject = new ReplaySubject<Array<MenuItemCustom>>(1);
    flatContent = new Map<string, BaseComponent>();
    removedContent = new Map<string, BaseComponent>();
    customContent = new Map<string, Function>();
    removedCustomContent = new Map<string, BaseComponent>();
    replacedContent = new Map<string, BaseComponent>();
    serverMenuItems = new Map<string, Array<serverMenuButtons>>();
    customMenuItems = new Map<string, Array<serverMenuButtons>>();
    mergedMenuItems = new Map<string, Array<serverMenuButtons>>();
    currentUser: UserData = new UserData();
    navigationNames = new Map<string, string>();

    //Sub Maps
    propertiesSubscriber = new Map<string, Function>();
    parentSubscriber = new Map<string, Function>();
    rowSelectionSubscriber = new Map<string, Map<string, Array<Function>>>();
    dataChangeSubscriber = new Map<string, Map<string, Array<{ displayRecords: number, fn: Function }>>>();
    appNameSubscriber = new Map<string, Function>();

    MenuSubscriber = new Array<Function>();
    popupSubscriber = new Array<Function>();

    //DataProvider Maps
    dataProviderData = new Map<string, Map<string, Array<any>>>();
    dataProviderMetaData = new Map<string, Map<string, MetaDataResponse>>();
    dataProviderFetched = new Map<string, Map<string, boolean>>();
    dataProviderSelectedRow = new Map<string, Map<string, any>>();

    GM_API_KEY:string = "";
    LOGO:string = "";

    //Content
    updateContent(componentsToUpdate: Array<BaseComponent>){
        const notifyList = new Array<string>();
        let existingComponent: BaseComponent | undefined;

        //Update FlatContent
        componentsToUpdate.forEach(newComponent => {
            const isCustom:boolean = this.customContent.has(newComponent.name as string);
            existingComponent = this.flatContent.get(newComponent.id) || this.replacedContent.get(newComponent.id) ||this.removedContent.get(newComponent.id);

            if(this.removedContent.has(newComponent.id) && existingComponent){
                if (!isCustom) {
                    this.removedContent.delete(newComponent.id);
                    this.flatContent.set(newComponent.id, existingComponent);
                }
                else {
                    this.removedCustomContent.delete(newComponent.id);
                    this.replacedContent.set(newComponent.id, existingComponent);
                }
            }

            //Notify Parent
            if(newComponent.parent || newComponent["~remove"] || newComponent["~destroy"] || newComponent.visible !== undefined || newComponent.constraints){
                notifyList.push(existingComponent?.parent || "");
                if(newComponent.parent){
                    notifyList.push(newComponent.parent);
                }
            }

            if((newComponent["~remove"] || newComponent["~destroy"]) && existingComponent){
                if (!isCustom) {
                    this.flatContent.delete(newComponent.id);
                    if(newComponent["~remove"])
                        this.removedContent.set(newComponent.id, existingComponent);
                    else
                        this.removedContent.delete(newComponent.id);
                }
                else {
                    this.replacedContent.delete(newComponent.id);
                    if (newComponent["~remove"])
                        this.removedCustomContent.set(newComponent.id, existingComponent);
                    else
                        this.removedCustomContent.delete(newComponent.id);
                }
            }

            // Add new Component or updated Properties
            if(existingComponent) {
                for (let newPropName in newComponent) {
                    // @ts-ignore
                    existingComponent[newPropName] = newComponent[newPropName]
                }
            } 
            else if (!isCustom)
                this.flatContent.set(newComponent.id, newComponent);
            else {
                const newComp:BaseComponent = {id: newComponent.id, parent: newComponent.parent, constraints: newComponent.constraints, name: newComponent.name,
                                               preferredSize: newComponent.preferredSize, minimumSize: newComponent.minimumSize, maximumSize: newComponent.maximumSize};
                this.replacedContent.set(newComponent.id, newComp)
            }
            
            const newCompAsPanel = (newComponent as Panel);

            if (newCompAsPanel.screen_navigationName_) {
                let increment:number|string = 0;
                for (let value of this.navigationNames.values()) {
                    if (value.replace(/\s\d+$/, '') === newCompAsPanel.screen_navigationName_)
                        increment++
                }
                if (increment === 0 || (increment === 1 && this.navigationNames.has(newCompAsPanel.name as string)))
                    increment = ''
                this.setNavigationName(newCompAsPanel.name as string, newCompAsPanel.screen_navigationName_ as string + increment.toString())
            }

            if ((newComponent as Panel).screen_modal_) 
                this.popupSubscriber[0].apply(undefined, [(newComponent as Panel).screen_navigationName_, false]);
        });

        //Properties
        componentsToUpdate.forEach(value => {
            const existingComp = this.flatContent.get(value.id) || this.replacedContent.get(value.id) || this.removedContent.get(value.id);
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
        const window = this.getWindowData(windowName);
        if(window){
            this.cleanUp(window.id, window.name);
        }
    }

    deleteChildren(parentId:string) {
        const children = this.getChildren(parentId);
        children.forEach(child => {
            this.deleteChildren(child.id);
            this.flatContent.delete(child.id);
        });
    }

    cleanUp(id:string, name:string|undefined) {
        if (name) {
            if ((this.flatContent.get(id) as Panel).screen_modal_)
                this.popupSubscriber[0].apply(undefined, [(this.flatContent.get(id) as Panel).screen_navigationName_, true]);
            this.deleteChildren(id);
            this.flatContent.delete(id);
            this.dataProviderData.delete(name);
            this.dataProviderMetaData.delete(name);
            this.dataProviderFetched.delete(name);
            this.dataProviderSelectedRow.delete(name);
            this.rowSelectionSubscriber.delete(name);
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
        this.navigationNames.clear();
        this.serverMenuItems.clear();
        this.customMenuItems.clear();
        this.mergedMenuItems.clear();
    }

    setNavigationName(compId:string, navName:string) {
        let existingMap = this.navigationNames.get(compId);
        if (existingMap)
            existingMap = navName;
        else
            this.navigationNames.set(compId, navName);
    }

    //Data Provider Management
    updateDataProviderData(compId:string, dataProvider: string, newDataSet: Array<any>, to: number, from: number){
        const existingMap = this.dataProviderData.get(compId);
        if (existingMap) {
            const existingData = existingMap.get(dataProvider);
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
            else {
                existingMap.set(dataProvider, newDataSet)
            }
        }
        else{
            const dataMap:Map<string, any[]> = new Map()
            dataMap.set(dataProvider, newDataSet)
            this.dataProviderData.set(compId, dataMap);
        }
        this.notifyDataChange(compId, dataProvider)
    }

    notifyDataChange(compId:string, dataProvider: string) {
        //Notify
        this.dataChangeSubscriber.get(compId)?.get(dataProvider)?.forEach(value => {
            value.fn.apply(undefined, []);
        });
    }

    getData(compId:string, dataProvider: string, from?: number, to?: number): Array<any>{
        const dataArray = this.dataProviderData.get(compId)?.get(dataProvider);
        if(from !== undefined && to !== undefined){
            return dataArray?.slice(from, to) || [];
        }

        return  dataArray || []
    }

    getDataRow(compId:string, dataProvider: string, indexOfRow: number) : any{
        const data = this.getData(compId, dataProvider);
        const dataRow = data[indexOfRow];
        if(dataRow)
            return dataRow;
        else
            return undefined
    }

    setSelectedRow(compId:string, dataProvider: string, dataRow: any, index: number) {
        const existingMapRow = this.dataProviderSelectedRow.get(compId);
        if (existingMapRow) {
            existingMapRow.set(dataProvider, dataRow);
        }
        else {
            const tempMapRow:Map<string, any> = new Map<string, any>();
            tempMapRow.set(dataProvider, dataRow);
            this.dataProviderSelectedRow.set(compId, tempMapRow);
        }
    }

    clearSelectedRow(compId:string, dataProvider: string) {
        this.dataProviderSelectedRow.get(compId)?.delete(dataProvider);
    }

    clearDataFromProvider(compId:string, dataProvider: string){
        this.dataProviderData.get(compId)?.delete(dataProvider);
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
        const mergedContent = new Map([...this.flatContent, ...this.replacedContent]);
        const componentEntries = mergedContent.entries();
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

    getComponentId(id:string) {
        let comp:BaseComponent|undefined = this.flatContent.get(id)
        if (comp) {
            while (comp?.parent) 
                comp = this.flatContent.get(comp?.parent)
        }
        return comp?.name
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

    subscribeToRowSelection(compId:string, dataProvider: string, fn: Function) {
        const existingMap = this.rowSelectionSubscriber.get(compId);
        if (existingMap) {
            const subscriber = existingMap.get(dataProvider);
            if(subscriber)
                subscriber.push(fn);
            else
                existingMap.set(dataProvider, new Array<Function>(fn));
        }
        else {
            const tempMap:Map<string, Function[]> = new Map<string, Function[]>();
            tempMap.set(dataProvider, new Array<Function>(fn));
            this.rowSelectionSubscriber.set(compId, tempMap);
        }

    }

    subscribeToDataChange(compId:string, dataProvider: string, fn: Function, displayRecords= 50){
        const existingMap = this.dataChangeSubscriber.get(compId);
        if (existingMap) {
            const subscriber = existingMap.get(dataProvider);
            if(subscriber)
                subscriber.push({fn: fn, displayRecords: displayRecords});
            else
                existingMap.set(dataProvider, new Array<{ displayRecords: number, fn: Function}>({fn: fn, displayRecords: displayRecords}));
        }
        else {
            const tempMap:Map<string, Array<{ displayRecords: number, fn: Function }>> = new Map();
            tempMap.set(dataProvider, new Array<{displayRecords: number, fn: Function}>({fn: fn, displayRecords: displayRecords}));
            this.dataChangeSubscriber.set(compId, tempMap);
        }
    }

    subscribeToAppName(id:string, fn: Function) {
        this.appNameSubscriber.set(id, fn);
    }

    subscribeToMenuChange(fn: Function){
        this.MenuSubscriber.push(fn);
    }

    subscribeToPopupChange(fn: Function) {
        this.popupSubscriber.push(fn);
    }

    unsubscribeFromPopupChange(fn: Function) {
        this.popupSubscriber.splice(this.popupSubscriber.findIndex(value => value === fn), 1);
    }

    unsubscribeFromMenuChange(fn: Function){
        this.MenuSubscriber.splice(this.MenuSubscriber.findIndex(value => value === fn), 1);
    }

    unsubscribeFromDataChange(compId:string, dataProvider: string, fn: Function){
        const subscriber = this.dataChangeSubscriber.get(compId)?.get(dataProvider)
        if(subscriber){
            subscriber.splice(subscriber.findIndex(value => value.fn === fn),1);
        }
    }

    unsubscribeFromRowSelection(compId:string, dataProvider: string, fn: Function){
        const subscriber = this.rowSelectionSubscriber.get(compId)?.get(dataProvider)
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
    emitRowSelect(compId:string, dataProvider: string){
        const rowSubscriber = this.rowSelectionSubscriber.get(compId)?.get(dataProvider);
        const selectedRow = this.dataProviderSelectedRow.get(compId)?.get(dataProvider);
        if(rowSubscriber)
            rowSubscriber.forEach(sub => {
                sub.apply(undefined, [selectedRow]);
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

    registerCustomComponent(title:string, compFactory: () => ReactElement) {
        this.customContent.set(title, compFactory);
    }
}