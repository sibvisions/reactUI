/** React imports */
import {ReactElement} from "react";

/** Other imports */
import {serverMenuButtons} from "./response/MenuResponse";
import BaseComponent from "./components/BaseComponent";
import UserData from "./model/UserData";
import MetaDataResponse from "./response/MetaDataResponse";
import {componentHandler} from "./factories/UIFactory";
import {Panel} from './components/panels/panel/UIPanel'

/**
 * The ContentStore stores active content like user, components subscribtions and more, it also handleshandles subscription events
 * and notifies the subscribers
 */
export default class ContentStore{
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
    /** A Map which stores custom display names for screens, key is the screen-name and the value is the name of the custom display */
    customDisplays = new Map<string, ReactElement>();

    //Sub Maps
    /** 
     * A Map which stores components which want to subscribe to their properties, 
     * the key is the component id and the value is a function to update the state of the properties 
     */
    propertiesSubscriber = new Map<string, Function>();
    /**
     * A Map which stores a function to update the state of a parents childcomponents, components which use the 
     * useComponents hook subscribe to the parentSubscriber the key is the component id and the 
     * value is a function to update the state of a parents childcomponents
     */
    parentSubscriber = new Map<string, Function>();
    /**
     * A Map which stores another Map of dataproviders of a screen, it subscribes the components which use the 
     * useRowSelect hook, to the changes of a screens dataproviders selectedRow, the key is the screens component id and the
     * value is another Map which key is the dataprovider and the value is an array of functions to update the
     * subscribers selectedRow state
     */
    rowSelectionSubscriber = new Map<string, Map<string, Array<Function>>>();
    /**
     * A Map which stores another Map of dataproviders of a screen, it subscribes the components which use the
     * useDataProviderData hook, to the changes of a screens dataproviders data, the key is the screens component id and the
     * value is another Map which key is the dataprovider and the value is an array of functions to update the
     * subscribers data state
     */
    dataChangeSubscriber = new Map<string, Map<string, Array<Function>>>();
    /**
     * A Map which stores a function to update a components state of all dataprovider data, key is the screens component id
     * value is the function to update the state
     */
    screenDataChangeSubscriber = new Map<string, Function>();
    /**
     * A Map which stores a function to update the screen-name state of the subscribers, the key is the name of the subscribers
     * and the value is the function to update the screen-name state
     */
    screenNameSubscriber = new Map<string, Function>();
    /**
     * A Map which stores a function to update the menu-collapsed state of the subscribers, the key is the name of the subscribers
     * and the value is the function to update the menu-collapsed state
     */
    menuCollapseSubscriber = new Map<string, Function>();

    /** An array of functions to update the menuitem states of its subscribers */
    MenuSubscriber = new Array<Function>();
    /** An array of functions to update the homechildren state of components which use the useHomeComponents hook */
    popupSubscriber = new Array<Function>();

    /** An array of functions to update the translationLoaded state of components which use the useTranslationLoaded hook */
    translationLoadedSubscriber = new Array<Function>();

    /** A function to change the register custom content state of a component*/
    registerCustomSubscriber:Function = () => {};

    //DataProvider Maps
    /**
     * A Map which stores another Map of dataproviders of a screen, the key is the screens component id and the
     * value is another map which key is the dataprovider and the value the data of the dataprovider
     */
    dataProviderData = new Map<string, Map<string, Array<any>>>();
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
            existingComponent = this.flatContent.get(newComponent.id) || this.replacedContent.get(newComponent.id) ||this.removedContent.get(newComponent.id);

            /** If the new component is in removedContent, either add it to flatContent or replacedContent if it is custom or not*/
            if(this.removedContent.has(newComponent.id)){
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
                if(newComponent.parent){
                    notifyList.push(newComponent.parent);
                }
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
                this.popupSubscriber[0].apply(undefined, [newCompAsPanel.screen_navigationName_, false]);
        });

        /** If the component already exists and it is subscribed to properties update the state */
        componentsToUpdate.forEach(value => {
            const existingComp = this.flatContent.get(value.id) || this.replacedContent.get(value.id) || this.removedContent.get(value.id);
            const updateFunction = this.propertiesSubscriber.get(value.id);
            if(existingComp && updateFunction){
                updateFunction(existingComp);
            }
        });
        /** Call the update function of the parentSubscribers */
        notifyList.filter(this.onlyUniqueFilter).forEach(parentId => this.parentSubscriber.get(parentId)?.apply(undefined, []));
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
        const window = this.getWindowData(windowName);
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
        this.propertiesSubscriber.clear();
        this.parentSubscriber.clear();
        this.rowSelectionSubscriber.clear();
        this.dataChangeSubscriber.clear();
        this.screenDataChangeSubscriber.clear();
        this.screenNameSubscriber.clear();
        this.menuCollapseSubscriber.clear();
        this.MenuSubscriber = new Array<Function>();
        this.popupSubscriber = new Array<Function>();
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
        this.notifyDataChange(compId, dataProvider);
        this.notifyScreenDataChange(compId);
    }

    /**
     * Notifies the components which use the useDataProviderData hook that their data changed
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     */
    notifyDataChange(compId:string, dataProvider: string) {
        //Notify
        this.dataChangeSubscriber.get(compId)?.get(dataProvider)?.forEach(value => {
            value.apply(undefined, []);
        });
    }

    /**
     * Notifies the components which use the useScreenData hook that the data of their screen changed
     * @param compId - the component id of the screen
     */
    notifyScreenDataChange(compId:string) {
        this.screenDataChangeSubscriber.get(compId)?.apply(undefined, []);
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
        const dataArray = this.dataProviderData.get(compId)?.get(dataProvider);
        if(from !== undefined && to !== undefined){
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
    clearDataFromProvider(compId:string, dataProvider: string){
        this.dataProviderData.get(compId)?.delete(dataProvider);
    }


    /**
     * Returns the built window
     * @param windowName - the name of the window
     * @returns the built window
     */
    getWindow(windowName: string): ReactElement{
        const windowData = this.getWindowData(windowName);
        if(windowData)
            return componentHandler(windowData);
        else
            return this.customContent.get(windowName)?.apply(undefined, []);
    }

    /**
     * Returns the data/properties of a window based on the name
     * @param windowName - the window name
     * @returns the data/properties of a window based on the name
     */
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
     * Calls the function of the screen-name subscribers to change their state
     * @param screenName - the current screen-name
     */
    notifyScreenNameChanged(screenName:string) {
        this.screenNameSubscriber.forEach(subscriber => {
            subscriber.apply(undefined, [screenName])
        })
    }

    /**
     * Sets the menu-mode
     * @param value - the menu-mode
     */
    setMenuModeAuto(value:boolean) {
        this.menuModeAuto = value;
    }

    /**
     * Subscribes the component which uses the useProperties hook, with the id to property changes
     * @param id - the component id
     * @param fn - the function to update the component's properties state
     */
    subscribeToPropChange(id: string, fn: Function){
        this.propertiesSubscriber.set(id, fn);
    }

    /**
     * Subscribes parents which use the useComponents hook, to change their childcomponent state
     * @param id - the component id
     * @param fn - the function to update a parents childcomponent state
     */
    subscribeToParentChange(id: string, fn: Function){
        this.parentSubscriber.set(id, fn);
    }

    /**
     * Subscribes components which use the useRowSelect hook, to change their selectedRow state
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the selectedRow state
     */
    subscribeToRowSelection(compId:string, dataProvider: string, fn: Function) {
        /** Checks if there is already a Map for the rowSelectionSubscriber */
        const existingMap = this.rowSelectionSubscriber.get(compId);
        if (existingMap) {
            /** Checks if there already is a function array of other components, if yes add the new function if not add the dataprovider with an array */
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
    /**
     * Subscribes components which use the useDataProviderData hook, to change their data state
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the data state
     */
    subscribeToDataChange(compId:string, dataProvider: string, fn: Function){
        /** Checks if there is already a Map for the dataChangeSubscriber */
        const existingMap = this.dataChangeSubscriber.get(compId);
        if (existingMap) {
            /** Checks if there already is a function array of other components, if yes add the new function if not add the dataprovider with an array */
            const subscriber = existingMap.get(dataProvider);
            if(subscriber)
                subscriber.push(fn);
            else
                existingMap.set(dataProvider, new Array<Function>(fn));
        }
        else {
            const tempMap:Map<string, Array<Function>> = new Map();
            tempMap.set(dataProvider, new Array<Function>(fn));
            this.dataChangeSubscriber.set(compId, tempMap);
        }
    }

    /**
     * Subscribes a component to its screen-data (every dataprovider data)
     * @param compId - the component id of the screen
     * @param fn - the function to update the state
     */
    subscribeToScreenDataChange(compId:string, fn:Function) {
        this.screenDataChangeSubscriber.set(compId, fn)
    }

    /**
     * Subscribes components to the screen-name, to change their screen-name state
     * @param id - the id of the component
     * @param fn - the function to update the screen-name state
     */
    subscribeToScreenName(id:string, fn: Function) {
        this.screenNameSubscriber.set(id, fn);
    }

    /**
     * Subscribes the menu to menuChanges , to change the menu-item state
     * @param fn - the function to update the menu-item state
     */
    subscribeToMenuChange(fn: Function){
        this.MenuSubscriber.push(fn);
    }

    /**
     * Subscribes components to popUpChanges, to change their homeComponents state
     * @param fn - the function to add or remove popups to the state
     */
    subscribeToPopupChange(fn: Function) {
        this.popupSubscriber.push(fn);
    }

    /**
     * Subscribes components to menuChanges (menu-collapsed), to change their menu-collapsed state
     * @param id - the component id
     * @param fn - the function to update the menu-collapsed state
     */
    subscribeToMenuCollapse(id:string, fn: Function) {
        this.menuCollapseSubscriber.set(id, fn);
    }

    /**
     * Subscribes components to translationLoaded , to change the translation-loaded state
     * @param fn - the function to update the translation-loaded state
     */
    subscribeToTranslation(fn: Function) {
        this.translationLoadedSubscriber.push(fn);
    }

    /**
     * Subscribes the app to register-custom, to change the register-custom flip value
     * @param fn - the function to update the register-custom flip value
     */
    subscribeToRegisterCustom(fn:Function) {
        this.registerCustomSubscriber = fn;
    }

    /**
     * Unsubscribes a component from popUpChanges
     * @param fn - the function to add or remove popups to the state
     */
    unsubscribeFromPopupChange(fn: Function) {
        this.popupSubscriber.splice(this.popupSubscriber.findIndex(value => value === fn), 1);
    }

    /**
     * Unsubscribes the menu from menuChanges
     * @param fn - the function to update the menu-item state
     */
    unsubscribeFromMenuChange(fn: Function){
        this.MenuSubscriber.splice(this.MenuSubscriber.findIndex(value => value === fn), 1);
    }

    /**
     * Unsubscribes components from translationLoaded
     * @param fn - the function to update the translation-loaded state
     */
    unsubscribeFromTranslation(fn: Function) {
        this.translationLoadedSubscriber.splice(this.translationLoadedSubscriber.findIndex(value => value === fn), 1);
    }

    /**
     * Unsubscibes components from dataChange
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the data state
     */
    unsubscribeFromDataChange(compId:string, dataProvider: string, fn: Function){
        const subscriber = this.dataChangeSubscriber.get(compId)?.get(dataProvider)
        if(subscriber){
            subscriber.splice(subscriber.findIndex(value => value === fn),1);
        }
    }

    /**
     * Unsubscribes a component from its screen-data (every dataprovider data)
     * @param compId - the component id of the screen
     */
    unsubscribeFromScreenDataChange(compId:string) {
        this.screenDataChangeSubscriber.delete(compId);
    }

    /**
     * Unsubscribes a component from rowSelection
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the selectedRow state
     */
    unsubscribeFromRowSelection(compId:string, dataProvider: string, fn: Function){
        const subscriber = this.rowSelectionSubscriber.get(compId)?.get(dataProvider)
        if(subscriber){
            subscriber.splice(subscriber.findIndex(value => value === fn),1);
        }
    }

    /**
     * Unsubscribes a component from parentChanges
     * @param id - the component id
     */
    unsubscribeFromParentChange(id: string){
        this.parentSubscriber.delete(id);
    }

    /**
     * Unsubscribes a component from property changes
     * @param id - the component id
     */
    unsubscribeFromPropChange(id: string){
        this.propertiesSubscriber.delete(id);
    }

    /**
     * Unsubscribes a component from screen-name changes
     * @param id - the component id
     */
    unsubscribeFromScreenName(id: string) {
        this.screenNameSubscriber.delete(id)
    }

    /**
     * Unsubscribes a component from menu-collapse
     * @param id - the component id
     */
    unsubscribeFromMenuCollapse(id:string) {
        this.menuCollapseSubscriber.delete(id);
    }

    /**
     * Unsubscribes app from register-custom
     */
    unsubscribeFromRegisterCustom() {
        this.subscribeToRegisterCustom = () => {}
    }


    /**
     * When a new row is selected call the function of the subscriber
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     */
    emitRowSelect(compId:string, dataProvider: string){
        const rowSubscriber = this.rowSelectionSubscriber.get(compId)?.get(dataProvider);
        const selectedRow = this.dataProviderSelectedRow.get(compId)?.get(dataProvider);
        if(rowSubscriber)
            rowSubscriber.forEach(sub => {
                sub.apply(undefined, [selectedRow]);
            });
    }

    /** When the menu-items change, call the function of the menu-subscriber */
    emitMenuUpdate(){
        this.MenuSubscriber.forEach(subFunction => {
            subFunction.apply(undefined, [this.mergedMenuItems]);
        });
    }

    /**
     * When menu collapses or expands, call the function of the menu-collapse subscriber and set the contentStore value
     * @param collapseVal - the collapse value
     */
    emitMenuCollapse(collapseVal:number) {
        this.menuCollapseSubscriber.forEach(subFunction => {
            subFunction.apply(undefined, [collapseVal]);
        })
        if (collapseVal === 0 && !this.menuCollapsed)
            this.menuCollapsed = true;
        else if (collapseVal === 1 && this.menuCollapsed)
            this.menuCollapsed = false;
        else if (collapseVal === 2)
            this.menuCollapsed = !this.menuCollapsed;
    }

    /** When the translation is loaded, notify the subscribers */
    emitTranslation() {
        this.translationLoadedSubscriber.forEach(subFunction => {
            subFunction.apply(undefined, [this.translation]);
        });
    }

    /** When the app needs to reregister the custom content*/
    emitRegisterCustom() {
        this.registerCustomSubscriber()
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
    registerCustomOfflineScreen(title: string, group: string, customScreen: ReactElement){
        const menuButton: serverMenuButtons = {
            group: group,

            componentId: "",
            image: "someIcon",
            text: "Click Me",
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
        this.customContent.set(title, () => replaceScreen);
    }

    /**
     * Registers a customComponent to the customContent
     * @param title - the title of the customComponent
     * @param customComp - the custom component
     */
    registerCustomComponent(title:string, customComp: ReactElement) {
        this.customContent.set(title, () => customComp);
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
     */
    registerCustomDisplay(screenName:string|string[], customDisplay:ReactElement) {
        if (Array.isArray(screenName))
            screenName.forEach(name => this.customDisplays.set(name, customDisplay));
        else 
            this.customDisplays.set(screenName, customDisplay);
    }
}