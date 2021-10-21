/** React imports */
import React, { ReactElement } from "react";

/** Other imports */
import { SubscriptionManager } from "./SubscriptionManager";
import { ServerMenuButtons, MetaDataResponse, MetaDataReference, BaseMenuButton } from "./response";
import BaseComponent from "./components/BaseComponent";
import UserData from "./model/UserData";
import TreePath from "./model/TreePath";
import { componentHandler } from "./factories/UIFactory";
import { IPanel } from './components/panels'
import { CustomStartupProps, CustomToolbarItem, EditableMenuItem, ScreenWrapperOptions } from "./customTypes";
import { getMetaData } from "./components/util";
import { RecordFormat, SortDefinition } from "./request"
import { History } from "history";
import { IToolBarPanel } from "./components/panels/toolbarPanel/UIToolBarPanel";
import { IToolBarHelper } from "./components/panels/toolbarPanel/UIToolBarHelper";
import COMPONENT_CLASSNAMES from "./components/COMPONENT_CLASSNAMES";

export type ActiveScreen = {
    name: string,
    className?: string
}

/** The ContentStore stores active content like user, components and data*/
export default class ContentStore{
    /** subscriptionManager instance */
    subManager:SubscriptionManager = new SubscriptionManager(this);

    /** A Map which stores the component which are displayed, the key is the components id and the value the component */
    flatContent = new Map<string, BaseComponent>();

    /** A Map which stores the component which are displayed in the desktop-panel, the key is the components id and the value the component */
    desktopContent = new Map<string, BaseComponent>();

    /** A Map which stores removed, but not deleted components, the key is the components id and the value the component */
    removedContent = new Map<string, BaseComponent>();

    /** A Map which stores removed, but not deleted components of the desktop-panel, the key is the components id and the value the component */
    removedDesktopContent = new Map<string, BaseComponent>();

    /** A Map which stores custom components made by the user, the key is the components title and the value a function to build the component*/
    //customContent = new Map<string, Function>();

    /** A Map which stores custom-screens made by the user, the key is the components title and the value a function to build the custom-screen*/
    customScreens = new Map<string, Function>();

    /** A Map which stores custom components made by the user, the key is the components title and the value a function to build the component*/
    customComponents = new Map<string, Function>();

    /** A Map which stores replace-screens made by the user, the key is the components title and the value a function to build the replace-screen*/
    replaceScreens = new Map<string, Function>();

    /** A Map which stores removed, but not deleted custom components, the key is the components id and the value the component */
    //removedCustomContent = new Map<string, BaseComponent>();

    removedCustomComponents = new Map<string, BaseComponent>();

    /** A Map which stores custom components which replace components sent by the server, the key is the components id and the value the component */
    replacedContent = new Map<string, BaseComponent>();

    menuItems = new Map<string, Array<ServerMenuButtons>>();

    /** The toolbar-entries sent by the server */
    toolbarItems = Array<BaseMenuButton>();

    /** The current logged in user */
    currentUser: UserData = new UserData();

    /** A Map which stores the navigation names for screens to route, the key is the componentId of the screen and the value is the navigation name */
    navigationNames = new Map<string, string>();

    /** A Map which stores the translation values, the key is the original text and the value is the translated text */
    translation = new Map<string, string>();

    /** A Map which stores application parameters sent by the server, the key is the property and the value is the value */
    customProperties = new Map<string, any>();

    /** A Map which stores screeen-wrapper names for screens, key is the screen-name and the value is the object of the screen-wrapper */
    screenWrappers = new Map<string, {wrapper: ReactElement, options: ScreenWrapperOptions}>();

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
     * A Map which stores the record formats per screen component id
     */
    dataProviderRecordFormat = new Map<string, RecordFormat>();

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

    /**
     * A Map which stores another Map of dataproviders of a screen, the key is the screens component id and the
     * value is another map which key is the dataprovider and the value are the sortdefinitions of a dataprovider
     */
    dataProviderSortedColumns = new Map<string, Map<string, SortDefinition[]>>();

    customStartUpProperties = new Array<CustomStartupProps>();

    /** The currently active screens usually only one screen but with popups multiple possible */
    activeScreens:ActiveScreen[] = [];

    /** The currently selected menu item */
    selectedMenuItem:string = "";

    /** the react routers history object */
    history?:History<any>;

    globalComponents:Map<string, Function> = new Map<string, Function>();

    dialogButtons:Array<string> = new Array<string>();

    constructor(history?:History<any>) {
        this.history = history;
    }

    /**
     * Sets the subscription-manager
     * @param subManager - the subscription-manager instance 
     */
    setSubscriptionManager(subManager:SubscriptionManager) {
        this.subManager = subManager;
    }

    /**
     * Sets the currently active screens or clears the array
     * @param screenName - the screenName of the newly opened screen or nothing to clear active screens
     * @param popup - true, if the newly opened screen is a popup
     */
    setActiveScreen(screenInfo?:ActiveScreen, popup?:boolean) {
        if (screenInfo) {
            if (popup) {
                this.activeScreens.push(screenInfo);
            }
            else {
                this.activeScreens = [screenInfo];
            }
        }
        else {
            this.activeScreens = [];
        }
        this.subManager.emitActiveScreens();
    }

    setStartupProperties(arr:CustomStartupProps[]) {
        this.customStartUpProperties = [...this.customStartUpProperties, ...arr];
    }

    //Content
    /**
     * Sets or updates flatContent, removedContent, replacedContent, updates properties and notifies subscriber
     * that either a popup should be displayed, properties changed, or their parent changed, based on server sent components
     * @param componentsToUpdate - an array of components sent by the server
     */
    updateContent(componentsToUpdate: Array<BaseComponent>, desktop: boolean) {
        /** An array of all parents which need to be notified */
        const notifyList = new Array<string>();
        /** 
         * Is the existing component if a component in the server sent components already exists in flatContent, replacedContent or
         * removedContent. Undefined if it is a new component
         */
        let existingComponent: BaseComponent | undefined;

        /**
         * Returns the constraint of the toolbar-main sub-panel.
         * @param tba - the toolbararea property
         */
        const getToolBarMainConstraint = (tba: 0 | 1 | 2 | 3) => {
            switch (tba) {
                case 0:
                    return "North";
                case 1:
                    return "West";
                case 2:
                    return "South";
                case 3:
                    return "East";
                default:
                    return "North";
            }
        }

        componentsToUpdate.forEach(newComponent => {
            /** Checks if the component is a custom component */
            const isCustom:boolean = this.customComponents.has(newComponent.name as string);
            existingComponent = this.flatContent.get(newComponent.id) || 
                                this.replacedContent.get(newComponent.id) ||
                                this.desktopContent.get(newComponent.id) || 
                                this.removedContent.get(newComponent.id) || 
                                this.removedCustomComponents.get(newComponent.id) ||
                                this.removedDesktopContent.get(newComponent.id);

            /** If the new component is in removedContent, either add it to flatContent or replacedContent if it is custom or not*/
            if(existingComponent && (this.removedContent.has(newComponent.id) || this.removedCustomComponents.has(newComponent.id) || this.removedDesktopContent.has(newComponent.id))) {
                if (!isCustom) {
                    if (desktop) {
                        this.removedDesktopContent.delete(newComponent.id);
                        this.desktopContent.set(newComponent.id, existingComponent);
                    }
                    else {
                        this.removedContent.delete(newComponent.id);
                        this.flatContent.set(newComponent.id, existingComponent);
                        // If the new component is a toolbarpanel, also add the sub-tb-panels to flatcontent
                        if (existingComponent.className === COMPONENT_CLASSNAMES.TOOLBARPANEL) {
                            const tbMain = this.removedContent.get(newComponent.id + "-tbMain");
                            const tbCenter = this.removedContent.get(newComponent.id + "-tbCenter");
                            if (tbMain && tbCenter) {
                                this.removedContent.delete(newComponent.id + "-tbMain");
                                this.removedContent.delete(newComponent.id + "-tbCenter");
                                this.flatContent.set(newComponent.id + "-tbMain", tbMain);
                                this.flatContent.set(newComponent.id + "tbCenter", tbCenter);
                            }
                        }
                    }
                    
                }
                else {
                    this.removedCustomComponents.delete(newComponent.id);
                    this.replacedContent.set(newComponent.id, existingComponent);
                }
            }

            /** Add parent of newComponent to notifyList */
            if (
                newComponent.parent || 
                newComponent["~remove"] || 
                newComponent["~destroy"] || 
                newComponent.visible !== undefined || 
                newComponent.constraints
            ) {
                const addToNotifyList = (comp:BaseComponent) => {
                    if (comp.parent) {
                        // If the new component's parent is a toolbar-panel, check which of the artificial parents should be notified (based on ~additional)
                        if (comp.parent.includes("TBP")) {
                            if (comp["~additional"]) {
                                notifyList.push(comp.parent + "-tbMain");
                            }
                            else {
                                notifyList.push(comp.parent + "-tbCenter");
                            }
                        }
                        else {
                            notifyList.push(comp.parent);
                        }
                    }
                }

                if (existingComponent) {
                    addToNotifyList(existingComponent);
                }
                else if(newComponent.parent) {
                    addToNotifyList(newComponent);
                }
            }

            /** Add new component or updated properties */
            if(existingComponent) {
                for (let newPropName in newComponent) {
                    // @ts-ignore
                    existingComponent[newPropName] = newComponent[newPropName];
                    if (existingComponent.className === COMPONENT_CLASSNAMES.TOOLBARPANEL) {
                        //When the layout for the toolbar-panel changes, don't overwrite the borderlayout of the outer, instead update the layout of the inner sub-panel.
                        if (newPropName === "layout") {                   
                            const tbCenter = this.flatContent.get(existingComponent.id + "-tbCenter");
                            // @ts-ignore
                            existingComponent[newPropName] = "BorderLayout,0,0,0,0,0,0";
                            if (tbCenter) {
                                //@ts-ignore
                                tbMain[newPropName] = newComponent[newPropName];
                            }
                        }
                        //When the toolbar-panel's toolBarArea changes, update the toolbar sub-panels constraints
                        else if (newPropName === "toolBarArea") {
                            const tbMain = this.flatContent.get(existingComponent.id + "-tbMain");
                            if (tbMain) {
                                tbMain.constraints = getToolBarMainConstraint((existingComponent as IToolBarPanel).toolBarArea);
                            }
                        }
                    }
                }
            } 
            else if (!isCustom) {
                if (desktop) {
                    this.desktopContent.set(newComponent.id, newComponent);
                }
                else {
                    //if the new component is a toolbar-panel add 2 sub-panels, one for the toolbar and one for the toolbar-panel's content.
                    if (newComponent.className === COMPONENT_CLASSNAMES.TOOLBARPANEL) {
                        const castedNewComp = newComponent as IToolBarPanel;
                        const innerLayout = castedNewComp.layout;
                        const constraint = getToolBarMainConstraint(castedNewComp.toolBarArea);
                        const flowOrientation = ["North", "South"].indexOf(constraint) !== -1 ? "0" : "1";
                        castedNewComp.layout = "BorderLayout,0,0,0,0,0,0";

                        const tbMain:IToolBarHelper = {
                            id: newComponent.id + "-tbMain",
                            parent: newComponent.id,
                            constraints: getToolBarMainConstraint(castedNewComp.toolBarArea),
                            name: newComponent.name + "-tbMain",
                            className: "ToolBarHelperMain",
                            layout: "FlowLayout,5,5,5,5,0,0," + flowOrientation + ",0,0,3,true",
                            layoutData: "",
                            isNavTable: castedNewComp.classNameEventSourceRef === "NavigationTable"
                        }

                        const tbCenter:IToolBarHelper = {
                            id: newComponent.id + "-tbCenter",
                            parent: newComponent.id,
                            constraints: "Center",
                            name: newComponent.name + "-tbCenter",
                            className: "ToolBarHelperCenter",
                            layout: innerLayout,
                            layoutData: castedNewComp.layoutData,
                            preferredSize: newComponent.preferredSize, 
                            minimumSize: newComponent.minimumSize, 
                            maximumSize: newComponent.maximumSize,
                            isNavTable: castedNewComp.classNameEventSourceRef === "NavigationTable"
                        }

                        this.flatContent.set(tbMain.id, tbMain);
                        this.flatContent.set(tbCenter.id, tbCenter);
                    }
                    this.flatContent.set(newComponent.id, newComponent);
                }
            }
            else {
                const newComp:BaseComponent = {
                    id: newComponent.id, 
                    parent: newComponent.parent, 
                    constraints: newComponent.constraints, 
                    name: newComponent.name,
                    preferredSize: newComponent.preferredSize, 
                    minimumSize: newComponent.minimumSize, 
                    maximumSize: newComponent.maximumSize,
                    className: ""
                };
                this.replacedContent.set(newComponent.id, newComp)
            }

            /** 
             * If newComponent already exists and has "remove", delete it from flatContent/replacedContent 
             * and add it to removedContent/removedCustomContent, if newComponent has "destroy", delete it from all maps
             */
            if (newComponent["~remove"] && existingComponent) {
                if (!isCustom) {
                    if (desktop) {
                        this.desktopContent.delete(newComponent.id);
                        this.removedDesktopContent.set(newComponent.id, existingComponent);
                    }
                    else {
                        const compToRemove = this.flatContent.get(newComponent.id);
                        this.flatContent.delete(newComponent.id);
                        this.removedContent.set(newComponent.id, existingComponent);
                        // When the toolbar-panel gets removed, also add the sub-panels to removedContent
                        if (compToRemove && compToRemove.className === COMPONENT_CLASSNAMES.TOOLBARPANEL) {
                            const tbMain = this.flatContent.get(compToRemove.id + "-tbMain");
                            const tbCenter = this.flatContent.get(compToRemove.id + "-tbCenter");
                            if (tbMain && tbCenter) {
                                this.flatContent.delete(compToRemove.id + "-tbMain");
                                this.flatContent.delete(compToRemove.id + "-tbCenter");
                                this.removedContent.set(compToRemove.id + "-tbMain", tbMain);
                                this.removedContent.set(compToRemove.id + "-tbCenter", tbCenter);
                            }
                        }
                    }
                }
                else {
                    this.replacedContent.delete(newComponent.id);
                    this.removedCustomComponents.set(newComponent.id, existingComponent);
                }
            }

            if (newComponent["~destroy"]) {
                const compToDestroy = this.flatContent.get(newComponent.id);
                if (desktop) {
                    this.desktopContent.delete(newComponent.id)
                }
                else {
                    this.flatContent.delete(newComponent.id);
                    if (compToDestroy && compToDestroy.className === COMPONENT_CLASSNAMES.TOOLBARPANEL) {
                        this.flatContent.delete(compToDestroy.id + "-tbMain");
                        this.flatContent.delete(compToDestroy.id + "-tbCenter");
                    }
                }

                if (!isCustom) {
                    this.removedContent.delete(newComponent.id);
                    if (compToDestroy && compToDestroy.className === COMPONENT_CLASSNAMES.TOOLBARPANEL) {
                        this.removedContent.delete(compToDestroy.id + "-tbMain");
                        this.removedContent.delete(compToDestroy.id + "-tbCenter");
                    }
                    this.removedDesktopContent.delete(newComponent.id);
                }
                else {
                    this.removedCustomComponents.delete(newComponent.id);
                }
            }
            
            /** Cast newComponent as Panel */
            const newCompAsPanel = (newComponent as IPanel);

            /** 
             * If the component has a navigation-name check, if the navigation-name already exists if it does, add a number
             * to the navigation-name, if not, don't add anything, and call setNavigationName
             */
            if (newCompAsPanel.screen_navigationName_) {
                let increment:number|string = 0;
                for (let value of this.navigationNames.values()) {
                    if (value.replace(/\s\d+$/, '') === newCompAsPanel.screen_navigationName_)
                        increment++
                }
                if (increment === 0 || (increment === 1 && this.navigationNames.has(newCompAsPanel.name)))
                    increment = ''
                this.setNavigationName(newCompAsPanel.name, newCompAsPanel.screen_navigationName_ + increment.toString())
            }

            if (newCompAsPanel.screen_className_) {
                this.selectedMenuItem = newCompAsPanel.screen_className_
                this.subManager.emitSelectedMenuItem(newCompAsPanel.screen_className_);
            }
        });

        /** If the component already exists and it is subscribed to properties update the state */
        componentsToUpdate.forEach(value => {
            const existingComp = this.flatContent.get(value.id)
                || this.replacedContent.get(value.id)
                || this.removedContent.get(value.id)
                || this.desktopContent.get(value.id)
                || this.removedDesktopContent.get(value.id);

            const updateFunction = this.subManager.propertiesSubscriber.get(value.id);

            if (existingComp) {
                if (existingComp.className === COMPONENT_CLASSNAMES.TOOLBARPANEL) {
                    const existingTbMain = this.flatContent.get(existingComp.id + "-tbMain") || this.removedContent.get(existingComp.id + "-tbMain");
                    const existingTbCenter = this.flatContent.get(existingComp.id + "-tbCenter") || this.removedContent.get(existingComp.id + "-tbCenter");
                    if (existingTbMain && existingTbCenter) {
                        const updateMain = this.subManager.propertiesSubscriber.get(existingTbMain.id);
                        const updateCenter = this.subManager.propertiesSubscriber.get(existingTbCenter.id);
                        if (updateMain && updateCenter) {
                            updateMain(existingTbMain);
                            updateCenter(existingTbCenter);
                        }
                    }
                }
                if (updateFunction) {
                    updateFunction(existingComp);
                }
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
    closeScreen(windowName: string, opensAnother?:boolean) {
        this.activeScreens = this.activeScreens.filter(screen => screen.name !== windowName);
        this.subManager.emitActiveScreens();
        if (this.activeScreens.length) {
            this.subManager.emitSelectedMenuItem(this.activeScreens.slice(-1).pop()!.className as string);
        }
        else if (!opensAnother) {
            this.subManager.emitSelectedMenuItem("");
        }
        const window = this.getComponentByName(windowName);
        if(window){
            this.cleanUp(window.id, window.name, window.className);
        }
    }

    /**
     * Deletes all children of a parent from flatContent, a child with children also deletes their children from flatContent
     * @param parentId - the id of the parent
     */
    deleteChildren(parentId:string, className: string) {
        const children = this.getChildren(parentId, className);
        children.forEach(child => {
            this.deleteChildren(child.id, child.className);
            this.flatContent.delete(child.id);
        });
    }

    /**
     * Deletes the component from flatContent and removes all data from the contentStore, if the compinent is a popup, close it
     * @param id - the component id
     * @param name - the component name
     */
    cleanUp(id:string, name:string|undefined, className: string) {
        if (name) {
            this.deleteChildren(id, className);
            this.flatContent.delete(id);

            //only do a total cleanup if there are no more components of that name
            if(!this.getComponentByName(name)) {
                this.dataProviderData.delete(name);
                this.dataProviderMetaData.delete(name);
                this.dataProviderFetched.delete(name);
                this.dataProviderRecordFormat.delete(name);
                this.dataProviderSelectedRow.delete(name);
                this.subManager.rowSelectionSubscriber.delete(name);
            }
        }
    }

    /** Resets the contentStore */
    reset(){
        this.flatContent.clear();
        this.removedContent.clear();
        this.customScreens.clear();
        this.customComponents.clear();
        this.replaceScreens.clear();
        this.removedCustomComponents.clear();
        this.replacedContent.clear();
        this.menuItems.clear();
        this.toolbarItems = new Array<BaseMenuButton>();
        this.currentUser = new UserData();
        this.navigationNames.clear();
        this.screenWrappers.clear();
        this.dataProviderData.clear();
        this.dataProviderMetaData.clear();
        this.dataProviderRecordFormat.clear();
        this.dataProviderFetched.clear();
        this.dataProviderSelectedRow.clear();
        this.dataProviderSortedColumns.clear();
        this.activeScreens = [];
        this.selectedMenuItem = "";
        this.toolbarItems = [];
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

    /**
     * Returns the built window
     * @param windowName - the name of the window
     * @returns the built window
     */
    getWindow(windowName: string) {
        const windowData = this.getComponentByName(windowName);
        if (this.replaceScreens.has(windowName)) {
            return this.replaceScreens.get(windowName)?.apply(undefined, [{ screenName: windowName }]);
        }
        else if (windowData) {
            return componentHandler(windowData, this);
        }
        else if (this.customScreens.has(windowName)) {
            return this.customScreens.get(windowName)?.apply(undefined, [{ screenName: windowName }]);
        }
    }

    /**
     * Returns the data/properties of a component based on the name
     * @param componentName - the name of the component
     * @returns the data/properties of a component based on the name
     */
    getComponentByName(componentName: string): BaseComponent | undefined {
        const mergedContent = new Map([...this.flatContent, ...this.replacedContent, ...this.desktopContent]);
        const componentEntries = mergedContent.entries();
        let foundEntry:BaseComponent|undefined;
        let entry = componentEntries.next();
        while (!entry.done) {
            if (entry.value[1].name === componentName) {
                foundEntry = entry.value[1];
            }
            entry = componentEntries.next();
        }
        return foundEntry;
    }

    /**
     * Returns all visible children of a parent, if tabsetpanel also return invisible
     * @param parentId - the id of the parent
     * @returns all visible children of a parent, if tabsetpanel also return invisible
     */
    getChildren(parentId: string, className: string): Map<string, BaseComponent> {
        const mergedContent = new Map([...this.flatContent, ...this.replacedContent, ...this.desktopContent]);
        const componentEntries = mergedContent.entries();
        let children = new Map<string, BaseComponent>();
        let entry = componentEntries.next();

        if (mergedContent.has(parentId) && className.includes("ToolBarHelper")) {
            parentId = mergedContent.get(parentId)!.parent as string
        }

        while (!entry.done) {
            if (parentId.includes("TP")) {
                if (entry.value[1].parent === parentId && !this.removedCustomComponents.has(entry.value[1].name)) {
                    children.set(entry.value[1].id, entry.value[1]);
                }
            }
            else if (entry.value[1].parent === parentId && entry.value[1].visible !== false && !this.removedCustomComponents.has(entry.value[1].name)) {
                children.set(entry.value[1].id, entry.value[1]);
            }
            entry = componentEntries.next();
        }

        if (className === COMPONENT_CLASSNAMES.TOOLBARPANEL) {
            children = new Map([...children].filter(entry => entry[0].includes("-tb")));
        }
        else if (className === COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN) {
            children = new Map([...children].filter(entry => entry[1]["~additional"]));
        }
        else if (className === COMPONENT_CLASSNAMES.TOOLBARHELPERCENTER) {
            children = new Map([...children].filter(entry => !entry[1]["~additional"] && !entry[0].includes("-tb")));
        }

        return children;
    }

    /**
     * Returns the component id of a screen for a component
     * @param id - the id of the component
     * @returns the component id of a screen for a component
     */
    getComponentId(id: string) {
        let comp: BaseComponent | undefined = this.flatContent.has(id) ? this.flatContent.get(id) : this.desktopContent.get(id);
        if (comp) {
            while (comp?.parent) {
                comp = this.flatContent.has(comp.parent) ? this.flatContent.get(comp.parent) : this.desktopContent.get(comp.parent);
            }
        }
        return comp?.name
    }

    //Data Provider Management

    /**
     * Sets or updates data of a dataprovider in a map and notifies components which use the useDataProviderData hook.
     * If the dataprovider has a master-reference, it saves its data in a Map, the key is the respective primary key
     * for the data of its master and the value is the data. Additionally there is a key "current" which holds data of the
     * current selected row of the master.
     * If there is no master-reference, it saves the data in a Map with one entry key: "current" value: data 
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param newDataSet - the new data
     * @param to - to which row will be set/updated
     * @param from - from which row will be set/updated
     * @param referenceKey - the primary key value of the master-reference
     * @param selectedRow - the currently selected row of the master-reference
     */
    updateDataProviderData(
        compId:string, 
        dataProvider:string, 
        newDataSet: Array<any>, 
        to:number, 
        from:number, 
        treePath?:number[], 
        referenceKey?:string,
        recordFormat?: RecordFormat,
    ) {

        const fillDataMap = (mapProv:Map<string, any>, mapScreen?:Map<string, any>, addDPD?:boolean) => {
            if (referenceKey !== undefined) {
                mapProv.set(referenceKey, newDataSet)
            } else {
                mapProv.set("current", newDataSet);
            }
                
            if (mapScreen) {
                mapScreen.set(dataProvider, mapProv);
                if (addDPD) {
                    this.dataProviderData.set(compId, mapScreen);
                }
            }
        }

        const existingMap = this.dataProviderData.get(compId);
        if (existingMap) {
            const existingProvider = existingMap.get(dataProvider);
            if (existingProvider) {
                const existingData = referenceKey ? existingProvider.get(referenceKey) : existingProvider.get("current");
                if (existingData) {
                    if (existingData.length <= from) {
                        existingData.push(...newDataSet);
                    } 
                    else {
                        let newDataSetIndex = 0;
                        for(let i = from; i <= to; i++) {
                            existingData[i] = newDataSet[newDataSetIndex];
                            newDataSetIndex++;
                        }
                    }
                } else {
                    fillDataMap(existingProvider);
                }
            } 
            else {
                const providerMap = new Map<string, Array<any>>();
                fillDataMap(providerMap, existingMap);
            }
        } 
        else {
            const dataMap = new Map<string, any>();
            const providerMap = new Map<string, Array<any>>();
            fillDataMap(providerMap, dataMap, true);
        }
        this.subManager.notifyDataChange(compId, dataProvider);
        this.subManager.notifyScreenDataChange(compId);
        
    }

    /**
     * Inserts a new datarow into an existing dataset. Always inserts the datarow into the next row of the selected-row.
     * If there is no row selected, the row is inserted at index 0.
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider 
     * @param referenceKey - the primary key value of the master-reference
     */
    insertDataProviderData(compId:string, dataProvider:string, referenceKey?:string) {
        const existingMap = this.dataProviderData.get(compId);
        if (existingMap) {
            const existingProvider = existingMap.get(dataProvider);
            if (existingProvider) {
                const existingData = referenceKey ? existingProvider.get(referenceKey) : existingProvider.get("current");
                if (existingData) {
                    const selectedRow = this.dataProviderSelectedRow.get(compId)?.get(dataProvider);
                    if (selectedRow) {
                        existingData.splice(selectedRow.index + 1, 0, {});
                    }
                    else {
                        existingData.splice(0, 0, {});
                    }
                }
            }
        }
    }

    /**
     * Deletes a datarow from an existing dataset. Deletes the selected-row
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider 
     * @param referenceKey - the primary key value of the master-reference
     */
    deleteDataProviderData(compId:string, dataProvider:string, index?:number, referenceKey?:string) {
        const existingMap = this.dataProviderData.get(compId);
        if (existingMap) {
            const existingProvider = existingMap.get(dataProvider);
            if (existingProvider) {
                const existingData = referenceKey ? existingProvider.get(referenceKey) : existingProvider.get("current");
                if (existingData) {
                    if (index) {
                        existingData.splice(index, 1);
                    }
                    else {
                        const selectedRow = this.dataProviderSelectedRow.get(compId)?.get(dataProvider);
                        if (selectedRow) {
                            existingData.splice(selectedRow.index, 1);
                        }
                    }

                }
            }
        }
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
        if (dataArray) {
            dataArray = dataArray.get("current")
            if(from !== undefined && to !== undefined) {
                return dataArray?.slice(from, to) || [];
            }
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
    setSelectedRow(compId:string, dataProvider: string, dataRow: any, index:number, treePath?:TreePath, selectedColumn?:string) {
        const existingMapRow = this.dataProviderSelectedRow.get(compId);
        if (existingMapRow) {
            existingMapRow.set(dataProvider, {dataRow: dataRow, index: index, treePath: treePath, selectedColumn: selectedColumn});
        }
        else {
            const tempMapRow:Map<string, any> = new Map<string, any>();
            tempMapRow.set(dataProvider, {dataRow: dataRow, index: index, treePath: treePath, selectedColumn: selectedColumn});
            this.dataProviderSelectedRow.set(compId, tempMapRow);
        }
        this.subManager.emitRowSelect(compId, dataProvider);
    }

    /**
     * Clears the selectedRow of a dataProvider
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     */
    clearSelectedRow(compId:string, dataProvider: string) {
        this.dataProviderSelectedRow.get(compId)?.delete(dataProvider);
        this.subManager.emitRowSelect(compId, dataProvider);
    }

    clearDataFromSubPage(compId:string, detailReferences?:MetaDataReference[]) {
        if (detailReferences !== undefined) {
            detailReferences.forEach(reference => {
                const referencedDataBook = reference.referencedDataBook;
                const metaData = getMetaData(compId, referencedDataBook, this);
                const dataBookData = this.dataProviderData.get(compId)?.get(referencedDataBook);
                if (dataBookData) {
                    for (let [key] of dataBookData) {
                        if (key !== "current") {
                            dataBookData.delete(key);
                        }
                    }
                }
                if (metaData && metaData.detailReferences) {
                    this.clearDataFromSubPage(compId, metaData.detailReferences);
                }
                this.subManager.notifyDataChange(compId, referencedDataBook);
                this.subManager.notifyScreenDataChange(compId);
            });
        }
    }

    /**
     * Clears the data of a dataProvider
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     */
    clearDataFromProvider(compId:string, dataProvider: string) {
        const data = this.dataProviderData.get(compId)?.get(dataProvider);
        const metaData = getMetaData(compId, dataProvider, this);
        if (data) {
            data.delete("current");
        }
        
        if (metaData && metaData.masterReference === undefined) {
            this.clearDataFromSubPage(compId, metaData.detailReferences);
        }
    }

    fillColumnDataProviderMap(compId:string, dataProvider:string, map:Map<string, any>, value:any) {
        const existingMap = map.get(compId);
        if (existingMap) {
            existingMap.set(dataProvider, value)
        }
        else {
            const provMap = new Map<string, SortDefinition[]>();
            provMap.set(dataProvider, value);
            map.set(compId, provMap);
        }
    }

    /**
     * Sets or updates the sort-definitions of a dataprovider in a map and then notifies the
     * components which use the useSortDefinitions hook to update their state.
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param sortDefinitions - the sort-definitions
     */
    setSortDefinition(compId: string, dataProvider: string, sortDefinitions: SortDefinition[]) {
        this.fillColumnDataProviderMap(compId, dataProvider, this.dataProviderSortedColumns, sortDefinitions);
        this.subManager.notifySortDefinitionChange(compId, dataProvider);
    }

    /**
     * Adds a menuItem to the contentStor
     * @param menuItem - the menuItem
     */
     addMenuItem(menuItem: ServerMenuButtons){
        const menuGroup = this.menuItems.get(menuItem.group);
        if(menuGroup) {
            menuGroup.push(menuItem);
        }
        else {
            this.menuItems.set(menuItem.group, [menuItem]);
        }
    }

    /**
     * Adds a toolbarItem to toolbarItems
     * @param toolbarItem - the toolbar-item
     */
    addToolbarItem(toolbarItem:BaseMenuButton) {
        if (!this.toolbarItems.some(item => item === toolbarItem)) {
            this.toolbarItems.push(toolbarItem);
        }
    }

    //Custom Screens

    /**
     * Registers a customScreen to the contentStore, which will create a menuButton, add the screen to the content and add a menuItem
     * @param title - the title of the customScreen
     * @param group - the menuGroup of the customScreen
     * @param customScreen - the function to build the component
     */
    registerCustomOfflineScreen(title: string, group: string, customScreen: ReactElement, icon?:string){
        const menuButton: ServerMenuButtons = {
            group: group,

            componentId: "",
            image: icon ? icon.substring(0,2) + " " + icon : "",
            text: title,
            action: () => {
                this.history?.push("/home/"+title);
                return Promise.resolve(true);
            }
        }

        //this.addCustomScreen(title, customScreen);
        this.addMenuItem(menuButton);
    }

    /**
     * Registers a replaceScreen to the replaceScreens
     * @param title - the title of the replaceScreen
     * @param replaceScreen - the replaceScreen
     */
    registerReplaceScreen(title: string, replaceScreen: ReactElement){
        this.replaceScreens.set(title, (x:any) => React.cloneElement(replaceScreen, x));
    }

    /**
     * Registers a customComponent to the customComponents
     * @param title - the title of the customComponent
     * @param customComp - the custom component
     */
    registerCustomComponent(title:string, customComp?:ReactElement) {
        if (customComp === undefined) {
            this.customComponents.set(title, () => null);
        }
        else {
            this.customComponents.set(title, () => customComp);
        }
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
     * Adds a screen-wrapper for screens
     * @param screenName - the screen/s in which the screen-wrapper should be displayed
     * @param wrapper - the name of the screen-wrapper component
     * @param pOptions - the options for the screen-wrapper component
     */
    registerScreenWrapper(screenName:string|string[], wrapper:ReactElement, pOptions?:ScreenWrapperOptions) {
        if (Array.isArray(screenName))
            screenName.forEach(name => this.screenWrappers.set(name, {wrapper: wrapper, options: pOptions ? pOptions : {global: true}}));
        else 
            this.screenWrappers.set(screenName, {wrapper: wrapper, options: pOptions ? pOptions : {global: true}});
    }
}