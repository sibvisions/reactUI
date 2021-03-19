/** React imports */
import React, {ReactElement} from "react";

/** Other imports */
import {serverMenuButtons} from "./response/MenuResponse";
import BaseComponent from "./components/BaseComponent";
import UserData from "./model/UserData";
import MetaDataResponse from "./response/MetaDataResponse";
import {componentHandler} from "./factories/UIFactory";
import {Panel} from './components/panels/panel/UIPanel'
import { SubscriptionManager } from "./SubscriptionManager";
import { CustomDisplayOptions } from "./customTypes/CustomDisplayType";

/** The ContentStore stores active content like user, components and data*/
export default class ContentStore{
    /** subscriptionManager instance */
    subManager:SubscriptionManager = new SubscriptionManager(this);
    /** A Map which stores the component which are displayed, the key is the components id and the value the component */
    flatContent = new Map<string, BaseComponent>();
    /** A Map which stores removed, but not deleted components, the key is the components id and the value the component */
    removedContent = new Map<string, BaseComponent>();
    /** A Map which stores custom components made by the user, the key is the components title and the value a function to build the component*/
    customContent = new Map<string, Function>();
    /** A Map which stores removed, but not deleted custom components, the key is the components id and the value the component */
    removedCustomContent = new Map<string, BaseComponent>();
    /** A Map which stores custom components which replace components sent by the server, the key is the components id and the value the component */
    replacedContent = new Map<string, BaseComponent>();
    /** A Map which stores the menuitems sent by the server, the key is the group of the menuitems and the value is the menuitem */
    serverMenuItems = new Map<string, Array<serverMenuButtons>>();
    /** A Map which stores custom menuitems, the key is the group of the menuitems and the value is the menuitem */
    customMenuItems = new Map<string, Array<serverMenuButtons>>();
    /** Combines serverMenuItems and customMenuItems */
    mergedMenuItems = new Map<string, Array<serverMenuButtons>>();
    /** The current logged in user */
    currentUser: UserData = new UserData();
    /** A Map which stores the navigation names for screens to route, the key is the componentId of the screen and the value is the navigation name */
    navigationNames = new Map<string, string>();
    /** A Map which stores the translation values, the key is the original text and the value is the translated text */
    translation = new Map<string, string>();
    /** A Map which stores application parameters sent by the server, the key is the property and the value is the value */
    customProperties = new Map<string, any>();
    /** A Map which stores custom display names for screens, key is the screen-name and the value is the object of the custom display */
    customDisplays = new Map<string, {display: ReactElement, options: CustomDisplayOptions}>();

    //DataProvider Maps
    /**
     * A Map which stores another Map of dataproviders of a screen, the key is the screens component id and the
     * value is another map which key is the dataprovider and the value the data of the dataprovider
     */
    dataProviderData = new Map<string, Map<string, any>>();
    /**
     * A Map which stores another Map of dataproviders of a screen, the key is the screens component id and the
     * value is another map which key is the dataprovider and the value the metadata of the dataprovider
     */
    dataProviderMetaData = new Map<string, Map<string, MetaDataResponse>>();
    /**
     * A Map which stores another Map of dataproviders of a screen, the key is the screens component id and the
     * value is another map which key is the dataprovider and the value if all data of the dataprovider has been fetched
     */
    dataProviderFetched = new Map<string, Map<string, boolean>>();
    /**
     * A Map which stores another Map of dataproviders of a screen, the key is the screens component id and the
     * value is another map which key is the dataprovider and the value is the selectedRow of a dataprovider
     */
    dataProviderSelectedRow = new Map<string, Map<string, any>>();

    /** The logo to display when the menu is expanded */
    LOGO_BIG:string = "/assets/logo_big.png";
    /** The logo to display when the menu is collapsed */
    LOGO_SMALL:string = "/assets/logo_small.png";
    /** The logo to display at the login screen */
    LOGO_LOGIN:string = "/assets/logo_login.png";
    /** The current region */
    locale:string = "de-DE";
    /** True, if the menu is collapsed, default value based on window width */
    menuCollapsed:boolean = window.innerWidth <= 1030 ? true : false;
    /**
     * If true the menu will collapse/expand based on window size, if false the menus position will be locked while resizing,
     * the value gets reset to true if the window width goes from less than 1030 pixel to more than 1030 pixel and menuModeAuto is false
     */
    menuModeAuto:boolean = true;
    /** True, if the menu should overlay the layout in mini mode */
    menuOverlaying:boolean = true;

    /**
     * Sets the subscription-manager
     * @param subManager - the subscription-manager instance 
     */
    setsubscriptionManager(subManager:SubscriptionManager) {
        this.subManager = subManager;
    }

    //Content
    /**
     * Sets or updates flatContent, removedContent, replacedContent, updates properties and notifies subscriber
     * that either a popup should be displayed, properties changed, or their parent changed, based on server sent components
     * @param componentsToUpdate - an array of components sent by the server
     */
    updateContent(componentsToUpdate: Array<BaseComponent>){
        /** An array of all parents which need to be notified */
        const notifyList = new Array<string>();
        /** 
         * Is the existing component if a component in the server sent components already exists in flatContent, replacedContent or
         * removedContent. Undefined if it is a new component
         */
        let existingComponent: BaseComponent | undefined;

        componentsToUpdate.forEach(newComponent => {
            /** Checks if the component is a custom component */
            const isCustom:boolean = this.customContent.has(newComponent.name as string);
            existingComponent = this.flatContent.get(newComponent.id) || this.replacedContent.get(newComponent.id) || 
                                this.removedContent.get(newComponent.id) || this.removedCustomContent.get(newComponent.id);

            /** If the new component is in removedContent, either add it to flatContent or replacedContent if it is custom or not*/
            if(this.removedContent.has(newComponent.id) || this.removedCustomContent.has(newComponent.id)){
                if (!isCustom) {
                    this.removedContent.delete(newComponent.id);
                    this.flatContent.set(newComponent.id, existingComponent as BaseComponent);
                }
                else {
                    this.removedCustomContent.delete(newComponent.id);
                    this.replacedContent.set(newComponent.id, existingComponent as BaseComponent);
                }
            }

            /** Add parent of newComponent to notifyList */
            if(newComponent.parent || newComponent["~remove"] || newComponent["~destroy"] || newComponent.visible !== undefined || newComponent.constraints){
                //Double add??
                notifyList.push(existingComponent?.parent || "");
                if(newComponent.parent)
                    notifyList.push(newComponent.parent);
            }

            /** 
             * If newComponent already exists and has "remove", delete it from flatContent/replacedContent 
             * and add it to removedContent/removedCustomContent, if newComponent has "destroy", delete it from all maps
             */
            if((newComponent["~remove"] || newComponent["~destroy"]) && existingComponent) {
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

            /** Add new Component or updated Properties */
            if(existingComponent) {
                for (let newPropName in newComponent) {
                    // @ts-ignore
                    existingComponent[newPropName] = newComponent[newPropName]
                }
            } 
            else if (!isCustom) {
                if (this.removedContent.has(newComponent.id))
                    this.removedContent.delete(newComponent.id)
                this.flatContent.set(newComponent.id, newComponent);
            }
            else {
                const newComp:BaseComponent = {id: newComponent.id, parent: newComponent.parent, constraints: newComponent.constraints, name: newComponent.name,
                                               preferredSize: newComponent.preferredSize, minimumSize: newComponent.minimumSize, maximumSize: newComponent.maximumSize};
                this.replacedContent.set(newComponent.id, newComp)
            }
            
            /** Cast newComponent as Panel */
            const newCompAsPanel = (newComponent as Panel);

            /** 
             * If the component has a navigation-name check, if the navigation-name already exists if it does, add a number
             * to the navigation-name, if not, don't add anything, and call setNavigationName
             */
            if ((newComponent as Panel).screen_navigationName_) {
                let increment:number|string = 0;
                for (let value of this.navigationNames.values()) {
                    if (value.replace(/\s\d+$/, '') === newCompAsPanel.screen_navigationName_)
                        increment++
                }
                if (increment === 0 || (increment === 1 && this.navigationNames.has(newCompAsPanel.name as string)))
                    increment = ''
                this.setNavigationName(newCompAsPanel.name as string, newCompAsPanel.screen_navigationName_ as string + increment.toString())
            }

            /** If newComponent has property screen_modal tell the popUpSubscribers to show the component as a popup*/
            if (newCompAsPanel.screen_modal_) 
                this.subManager.popupSubscriber[0].apply(undefined, [newCompAsPanel.screen_navigationName_, false]);
        });

        /** If the component already exists and it is subscribed to properties update the state */
        componentsToUpdate.forEach(value => {
            const existingComp = this.flatContent.get(value.id) || this.replacedContent.get(value.id) || this.removedContent.get(value.id);
            const updateFunction = this.subManager.propertiesSubscriber.get(value.id);
            if(existingComp && updateFunction){
                updateFunction(existingComp);
            }
        });
        /** Call the update function of the parentSubscribers */
        notifyList.filter(this.onlyUniqueFilter).forEach(parentId => this.subManager.parentSubscriber.get(parentId)?.apply(undefined, []));
    }

    /** Filter function for notifyList */
    onlyUniqueFilter(value: string, index: number, self: Array<string>) {
        return self.indexOf(value) === index;
    }

    /**
     * When a screen closes cleanUp the data for the window 
     * @param windowName - the name of the window to close
     */
    closeScreen(windowName: string){
        const window = this.getComponentByName(windowName);
        if(window){
            this.cleanUp(window.id, window.name);
        }
    }

    /**
     * Deletes all children of a parent from flatContent, a child with children also deletes their children from flatContent
     * @param parentId - the id of the parent
     */
    deleteChildren(parentId:string) {
        const children = this.getChildren(parentId);
        children.forEach(child => {
            this.deleteChildren(child.id);
            this.flatContent.delete(child.id);
        });
    }

    /**
     * Deletes the component from flatContent and removes all data from the contentStore, if the compinent is a popup, close it
     * @param id - the component id
     * @param name - the component name
     */
    cleanUp(id:string, name:string|undefined) {
        if (name) {
            if ((this.flatContent.get(id) as Panel).screen_modal_)
                this.subManager.popupSubscriber[0].apply(undefined, [(this.flatContent.get(id) as Panel).screen_navigationName_, true]);
            this.deleteChildren(id);
            this.flatContent.delete(id);
            this.dataProviderData.delete(name);
            this.dataProviderMetaData.delete(name);
            this.dataProviderFetched.delete(name);
            this.dataProviderSelectedRow.delete(name);
            this.subManager.rowSelectionSubscriber.delete(name);
        }
    }

    /** Resets the contentStore */
    reset(){
        this.flatContent.clear();
        this.removedContent.clear();
        this.customContent.clear();
        this.removedCustomContent.clear();
        this.replacedContent.clear();
        this.serverMenuItems.clear();
        this.customMenuItems.clear();
        this.mergedMenuItems.clear();
        this.currentUser = new UserData();
        this.navigationNames.clear();
        this.customProperties.clear();
        this.customDisplays.clear();
        this.subManager.propertiesSubscriber.clear();
        this.subManager.parentSubscriber.clear();
        this.subManager.rowSelectionSubscriber.clear();
        this.subManager.dataChangeSubscriber.clear();
        this.subManager.screenDataChangeSubscriber.clear();
        this.subManager.screenNameSubscriber.clear();
        this.subManager.menuCollapseSubscriber.clear();
        this.subManager.menuSubscriber = new Array<Function>();
        this.subManager.popupSubscriber = new Array<Function>();
        this.dataProviderData.clear();
        this.dataProviderMetaData.clear();
        this.dataProviderFetched.clear();
        this.dataProviderSelectedRow.clear();
    }

    /**
     * Sets or updates the navigation-name for a screen
     * @param compId - the component id of a screen
     * @param navName - the navigation name of a screen
     */
    setNavigationName(compId:string, navName:string) {
        let existingMap = this.navigationNames.get(compId);
        if (existingMap)
            existingMap = navName;
        else
            this.navigationNames.set(compId, navName);
    }

    //Data Provider Management
    /**
     * Sets or updates data of a dataprovider and notifies components which use the useDataProviderData hook
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param newDataSet - the new data
     * @param to - to which row will be set/updated
     * @param from - from which row will be set/updated
     */
    updateDataProviderData(compId:string, dataProvider: string, newDataSet: Array<any>, to: number, from: number){
        const existingMap = this.dataProviderData.get(compId);
        if (existingMap) {
            const existingData = existingMap.get(dataProvider);
            if(existingData){
                if(existingData.length <= from){
                    existingData.push(...newDataSet)
                } else {
                    let newDataSetIndex = 0;
                    for(let i = from; i <= to; i++) {
                        existingData[i] = newDataSet[newDataSetIndex];
                        newDataSetIndex++;
                    }
                }
            }
            else
                existingMap.set(dataProvider, newDataSet)
        }
        else{
            const dataMap:Map<string, any[]> = new Map()
            dataMap.set(dataProvider, newDataSet)
            this.dataProviderData.set(compId, dataMap);
        }
        this.subManager.notifyDataChange(compId, dataProvider);
        this.subManager.notifyScreenDataChange(compId);
    }

    /**
     * Sets or updates data of a dataprovider in a map and notifies components which use the useDataProviderData hook.
     * Is used when the dataprovider has a master-reference, so it saves its data in a Map, the key is the respective primary key
     * for the data of its master and the value is the data. Additionally there is a key "current" which holds data of the
     * current selected row of the master.
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param newDataSet - the new data
     * @param to - to which row will be set/updated
     * @param from - from which row will be set/updated
     * @param referenceKey - the primary key value of the master-reference 
     * @param selectedRow - the currently selected row of the master-reference
     */
    updateDataProviderMap(compId:string, dataProvider:string, newDataSet: Array<any>, to:number, from:number, referenceKey:string, selectedRow:string) {
        const existingMap = this.dataProviderData.get(compId);
        if (existingMap) {
            const existingProvider = existingMap.get(dataProvider);
            if (existingProvider && existingProvider instanceof Map) {
                const existingMaster = existingProvider.get(referenceKey);
                if (existingMaster) {
                    if (existingMaster.length <= from)
                        existingMaster.push(...newDataSet);
                    else {
                        let newDataSetIndex = 0;
                        for(let i = from; i <= to; i++) {
                            existingMaster[i] = newDataSet[newDataSetIndex];
                            newDataSetIndex++;
                        }
                    }
                }
                else
                    existingProvider.set(referenceKey, newDataSet);

                if (existingProvider.has(selectedRow))
                    existingProvider.set("current", existingProvider.get(selectedRow) as any[]);
            }
            else {
                const providerMap = new Map<string, Array<any>>();
                providerMap.set(referenceKey, newDataSet);
                if (providerMap.has(selectedRow))
                    providerMap.set("current", providerMap.get(selectedRow) as any[])
                else
                    providerMap.set("current", new Array<any>());
                existingMap.set(dataProvider, providerMap);
            }
        }
        else {
            const dataMap = new Map<string, any>();
            const providerMap = new Map<string, Array<any>>();
            providerMap.set(referenceKey, newDataSet);
            if (providerMap.has(selectedRow))
                providerMap.set("current", providerMap.get(selectedRow) as any[])
            else
                providerMap.set("current", new Array<any>());
            dataMap.set(dataProvider, providerMap);
            this.dataProviderData.set(compId, dataMap);
        }
        this.subManager.notifyDataChange(compId, dataProvider);
        this.subManager.notifyScreenDataChange(compId);
    }

    /**
     * Returns either a part of the data of a dataprovider specified by "from" and "to" or all data
     * @param compId - the component id of a screen
     * @param dataProvider - the dataprovider
     * @param from - from which row to return
     * @param to - to which row to return
     * @returns either a part of the data of a dataprovider specified by "from" and "to" or all data
     */
    getData(compId:string, dataProvider: string, from?: number, to?: number): Array<any>{
        let dataArray = this.dataProviderData.get(compId)?.get(dataProvider);
        if (dataArray instanceof Map)
            dataArray = dataArray.get("current")
        if(from !== undefined && to !== undefined) {
            return dataArray?.slice(from, to) || [];
        }

        return  dataArray || []
    }

    /**
     * Returns either the dataRow of a dataprovider with the given index or undefined if row has not been found
     * @param compId - the component id of a screen
     * @param dataProvider - the dataprovider
     * @param indexOfRow - the index of the row to get
     * @returns either the dataRow of a dataprovider with the given index or undefined if row has not been found
     */
    getDataRow(compId:string, dataProvider: string, indexOfRow: number) : any{
        const data = this.getData(compId, dataProvider);
        const dataRow = data[indexOfRow];
        if(dataRow)
            return dataRow;
        else
            return undefined
    }

    /**
     * Sets or updates the currently selectedRow of a dataprovider
     * @param compId - the component id of a screen
     * @param dataProvider - the dataprovider
     * @param dataRow - the selectedDataRow
     */
    setSelectedRow(compId:string, dataProvider: string, dataRow: any) {
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

    /**
     * Clears the selectedRow of a dataProvider
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     */
    clearSelectedRow(compId:string, dataProvider: string) {
        this.dataProviderSelectedRow.get(compId)?.delete(dataProvider);
    }

    /**
     * Clears the data of a dataProvider
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     */
    clearDataFromProvider(compId:string, dataProvider: string, selectedRow?:string){
        if (this.dataProviderData.get(compId)?.get(dataProvider) instanceof Map && selectedRow)
            this.dataProviderData.get(compId)?.get(dataProvider).delete(selectedRow)
        else
            this.dataProviderData.get(compId)?.delete(dataProvider);
    }


    /**
     * Returns the built window
     * @param windowName - the name of the window
     * @returns the built window
     */
    getWindow(windowName: string): ReactElement{
        const windowData = this.getComponentByName(windowName);
        if(windowData)
            return componentHandler(windowData);
        else
            return this.customContent.get(windowName)?.apply(undefined, [{screenName: windowName}]);
    }

    /**
     * Returns the data/properties of a component based on the name
     * @param componentName - the name of the component
     * @returns the data/properties of a component based on the name
     */
    getComponentByName(componentName: string): BaseComponent | undefined{
        let componentEntries = this.flatContent.entries();
        let entry = componentEntries.next();
        while(!entry.done){
            if(entry.value[1].name === componentName){
                return entry.value[1];
            }
            entry = componentEntries.next();
        }
        return undefined;
    }

    /**
     * Returns all visible children of a parent, if tabsetpanel also return invisible
     * @param parentId - the id of the parent
     * @returns all visible children of a parent, if tabsetpanel also return invisible
     */
    getChildren(parentId: string): Map<string, BaseComponent>{
        const mergedContent = new Map([...this.flatContent, ...this.replacedContent]);
        const componentEntries = mergedContent.entries();
        const children = new Map<string, BaseComponent>();
        let entry = componentEntries.next();
        while (!entry.done){
            if (parentId.includes("TP")) {
                if(entry.value[1].parent === parentId) {
                    children.set(entry.value[1].id, entry.value[1]);
                }
            }
            else if(entry.value[1].parent === parentId && entry.value[1].visible !== false){
                children.set(entry.value[1].id, entry.value[1]);
            }
            entry = componentEntries.next();
        }
        return children;
    }

    /**
     * Returns the component id of a screen for a component
     * @param id - the id of the component
     * @returns the component id of a screen for a component
     */
    getComponentId(id:string) {
        let comp:BaseComponent|undefined = this.flatContent.get(id)
        if (comp) {
            while (comp?.parent) {
                comp = this.flatContent.get(comp?.parent)
            }
                
        }
        return comp?.name
    }

    /**
     * Sets the menu-mode
     * @param value - the menu-mode
     */
    setMenuModeAuto(value:boolean) {
        this.menuModeAuto = value;
    }

    //Custom Screens

    /**
     * Adds a menuItem to serverMenuItems or customMenuItems to the contentStore, depending on server sent or not, merges the menuItems
     * @param menuItem - the menuItem
     * @param fromServer - if the server sent the menuItem or if it is custom
     */
    addMenuItem(menuItem: serverMenuButtons, fromServer:boolean){
        const menuGroup = fromServer ? this.serverMenuItems.get(menuItem.group) : this.customMenuItems.get(menuItem.group);
        if(menuGroup)
            menuGroup.push(menuItem);
        else {
            fromServer ? this.serverMenuItems.set(menuItem.group, [menuItem]) : this.customMenuItems.set(menuItem.group, [menuItem]);
        }
        this.mergeMenuButtons();
    }

    /** Merges the server sent menuItems and the custom menuItems */
    mergeMenuButtons() {
        this.mergedMenuItems = new Map([...this.serverMenuItems, ...this.customMenuItems])
    }

    /**
     * Adds a customScreen to customContent
     * @param title - the title of the custom screen
     * @param customScreen - the custom screen
     */
    addCustomScreen(title: string, customScreen: ReactElement){
        this.customContent.set(title, () => customScreen);
    }

    /**
     * Registers a customScreen to the contentStore, which will create a menuButton, add the screen to the content and add a menuItem
     * @param title - the title of the customScreen
     * @param group - the menuGroup of the customScreen
     * @param customScreen - the function to build the component
     */
    registerCustomOfflineScreen(title: string, group: string, customScreen: ReactElement, icon?:string){
        const menuButton: serverMenuButtons = {
            group: group,

            componentId: "",
            image: icon ? icon.substring(0,2) + " " + icon : "",
            text: title,
            action: () => {
                window.location.hash = "/home/"+title;
            }
        }

        this.addCustomScreen(title, customScreen);
        this.addMenuItem(menuButton, false);
    }

    /**
     * Registers a replaceScreen to the customContent
     * @param title - the title of the replaceScreen
     * @param replaceScreen - the replaceScreen
     */
    registerReplaceScreen(title: string, replaceScreen: ReactElement){
        this.customContent.set(title, (x:any) => React.cloneElement(replaceScreen, x));
    }

    /**
     * Registers a customComponent to the customContent
     * @param title - the title of the customComponent
     * @param customComp - the custom component
     */
    registerCustomComponent(title:string, customComp?:ReactElement) {
        if (customComp === undefined)
            this.customContent.set(title, () => null)
        else
            this.customContent.set(title, () => customComp);
        /** Notifies the parent that a custom component has replaced a server sent component */
        if (this.getComponentByName(title)) {
            const customComp = this.getComponentByName(title) as BaseComponent
            const notifyList = new Array<string>();
            if (customComp.parent)
                notifyList.push(customComp.parent);
            notifyList.filter(this.onlyUniqueFilter).forEach(parentId => this.subManager.parentSubscriber.get(parentId)?.apply(undefined, []));
        }
    }

    /**
     * Either sets or updates applicationParameters sent by the server, or deletes them if their value is null
     * @param property - the name of the property
     * @param value - the value of the property
     */
    handleCustomProperties(property:string, value:any) {
        const customPropValue = this.customProperties.get(property);
        if (customPropValue && value === null) {
            this.customProperties.delete(property);
        }
        else {
            this.customProperties.set(property, value);
        }
    }

    /**
     * Adds a custom display for screens
     * @param screenName - the screen/s in which the custom display should be displayed
     * @param customDisplay - the name of the custom display component
     * @param pOptions - the options for the custom display component
     */
    registerCustomDisplay(screenName:string|string[], customDisplay:ReactElement, pOptions?:CustomDisplayOptions) {
        if (Array.isArray(screenName))
            screenName.forEach(name => this.customDisplays.set(name, {display: customDisplay, options: pOptions ? pOptions : {global: true}}));
        else 
            this.customDisplays.set(screenName, {display: customDisplay, options: pOptions ? pOptions : {global: true}});
    }
}