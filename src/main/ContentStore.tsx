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
import { CustomStartupProps, ScreenWrapperOptions } from "./customTypes";
import { getMetaData, Timer } from "./components/util";
import { RecordFormat, SortDefinition } from "./request"
import { History } from "history";
import { IToolBarPanel } from "./components/panels/toolbarPanel/UIToolBarPanel";
import { IToolBarHelper } from "./components/panels/toolbarPanel/UIToolBarHelper";
import COMPONENT_CLASSNAMES from "./components/COMPONENT_CLASSNAMES";

export type ActiveScreen = {
    name: string,
    className?: string
}

interface ISelectedRow {
    dataRow: any,
    index: number,
    treePath?: TreePath,
    selectedColumn?: string
}

export interface IDataBook {
    data?: Map<string, any>,
    metaData?: MetaDataResponse,
    allFetched?: boolean,
    selectedRow?: ISelectedRow,
    sortedColumns?: SortDefinition[],
    missingDataFetched?: boolean
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

    /** A Map which stores a workscreens nav-name as key and the componentId of the menu as value to open screens when navigating */
    navOpenScreenMap = new Map<string, string>();

    /** A Map which stores the translation values, the key is the original text and the value is the translated text */
    translation = new Map<string, string>();

    /** A Map which stores application parameters sent by the server, the key is the property and the value is the value */
    customProperties = new Map<string, any>();

    /** A Map which stores screeen-wrapper names for screens, key is the screen-name and the value is the object of the screen-wrapper */
    screenWrappers = new Map<string, {wrapper: ReactElement, options: ScreenWrapperOptions}>();

    //DataProvider Maps
    dataBooks = new Map<string, Map<string, IDataBook>>();

    customStartUpProperties = new Array<CustomStartupProps>();

    /** The currently active screens usually only one screen but with popups multiple possible */
    activeScreens:ActiveScreen[] = [];

    /** The currently selected menu item */
    selectedMenuItem:string = "";

    /** the react routers history object */
    history?:History<any>;

    globalComponents:Map<string, Function> = new Map<string, Function>();

    dialogButtons:Array<string> = new Array<string>();

    ws:WebSocket|undefined;

    timer:Timer|undefined;

    mobileLauncher:ActiveScreen[] = [];

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
     * Returns the component if it already exists in the contentstore
     * @param id - the id of the component
     */
    getExistingComponent(id:string) {
        return this.flatContent.get(id) || this.replacedContent.get(id) || this.desktopContent.get(id) || 
               this.removedContent.get(id) || this.removedCustomComponents.get(id) ||this.removedDesktopContent.get(id);
    }

    /**
     * Returns true if the component is in one of the "removed" maps in the contentstore
     * @param id 
     * @returns 
     */
    isRemovedComponent(id:string) {
        return this.removedContent.has(id) || this.removedCustomComponents.has(id) || this.removedDesktopContent.has(id);
    }

    /**
     * Returns the constraint of the toolbar-main sub-panel.
     * @param tba - the toolbararea property
     */
    getToolBarMainConstraint(tba: 0 | 1 | 2 | 3) {
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

    /**
     * Updates a components properties when the server sends new properties
     * @param existingComp - the existing component already in contentstore
     * @param newComp - the new component of changedcomponents
     */
    updateExistingComponent(existingComp:BaseComponent|undefined, newComp:BaseComponent) {
        if (existingComp) {
            for (let newPropName in newComp) {
                // @ts-ignore
                existingComp[newPropName] = newComp[newPropName];

                if (newPropName === "parent" && existingComp.className === COMPONENT_CLASSNAMES.TOOLBAR && existingComp.parent?.includes("ML") && newComp.parent?.includes("ML")) {
                    existingComp[newPropName] = newComp[newPropName] + "-frame-toolbar";
                }

                if (existingComp.className === COMPONENT_CLASSNAMES.TOOLBARPANEL) {
                    this.updateToolBarProperties(existingComp as IToolBarPanel, newComp as IToolBarPanel, newPropName);
                }
            }
        }
    }

    /**
     * Updates a toolbars properties when the server sends new ones
     * @param existingComp - the existing component already in contentstore
     * @param newComp - the new component of changedcomponents
     * @param newProp - the property name to update
     */
    updateToolBarProperties(existingComp:IToolBarPanel, newComp:IToolBarPanel, newProp:string) {
        const tbMain = this.getExistingComponent(existingComp.id + "-tbMain") as IToolBarHelper;
        const tbCenter = this.getExistingComponent(existingComp.id + "-tbCenter") as IToolBarHelper;
        //When the layout for the toolbar-panel changes, don't overwrite the borderlayout of the outer, instead update the layout of the inner sub-panel.
        if (newProp === "layout") {
            existingComp[newProp] = "BorderLayout,0,0,0,0,0,0";
            if (tbCenter) {
                tbCenter[newProp] = newComp[newProp];
            }
        }
        //When the toolbar-panel's toolBarArea changes, update the toolbar sub-panels constraints
        else if (newProp === "toolBarArea" && tbMain) {
            tbMain.constraints = this.getToolBarMainConstraint(existingComp.toolBarArea);
        }
    }

    /**
     * Handles adding removing of the toolbar sub elements
     * @param existingComp - the existing component already in contentstore
     * @param newComp - the new component of changedcomponents
     */
    handleToolBarComponent(existingComp:IToolBarPanel|undefined, newComp:IToolBarPanel) {
        if (existingComp) {
            const tbMain = this.getExistingComponent(existingComp.id + "-tbMain");
            const tbCenter = this.getExistingComponent(existingComp.id + "-tbCenter");
            if (newComp["~remove"] !== true) {
                if (this.isRemovedComponent(existingComp.id)) {
                    if (tbMain && tbCenter) {
                        this.removedContent.delete(existingComp.id + "-tbMain");
                        this.removedContent.delete(existingComp.id + "-tbCenter");
                        this.flatContent.set(existingComp.id + "-tbMain", tbMain);
                        this.flatContent.set(existingComp.id + "tbCenter", tbCenter);
                    }
                }
            }
            else {
                // When the toolbar-panel gets removed, also add the sub-panels to removedContent
                if (tbMain && tbCenter) {
                    this.flatContent.delete(existingComp.id + "-tbMain");
                    this.removedContent.set(existingComp.id + "-tbMain", tbMain);

                    this.flatContent.delete(existingComp.id + "-tbCenter");
                    this.removedContent.set(existingComp.id + "-tbCenter", tbCenter);
                }
            }

            if (newComp["~destroy"]) {
                this.flatContent.delete(existingComp.id + "-tbMain");
                this.flatContent.delete(existingComp.id + "-tbCenter");

                this.removedContent.delete(existingComp.id + "-tbMain");
                this.removedContent.delete(existingComp.id + "tb-Center");
                
            }
        }
        else {
            //if the new component is a toolbar-panel add 2 sub-panels, one for the toolbar and one for the toolbar-panel's content.
            const innerLayout = newComp.layout;
            const constraint = this.getToolBarMainConstraint(newComp.toolBarArea);
            const flowOrientation = ["North", "South"].indexOf(constraint) !== -1 ? "0" : "1";
            newComp.layout = "BorderLayout,0,0,0,0,0,0";

            const tbMain:IToolBarHelper = {
                id: newComp.id + "-tbMain",
                parent: newComp.id,
                constraints: this.getToolBarMainConstraint(newComp.toolBarArea),
                name: newComp.name + "-tbMain",
                className: "ToolBarHelperMain",
                layout: "FlowLayout,5,5,5,5,0,0," + flowOrientation + ",0,0,3,true",
                layoutData: "",
                isNavTable: newComp.classNameEventSourceRef === "NavigationTable",
                toolBarVisible: newComp.toolBarVisible
            }

            const tbCenter:IToolBarHelper = {
                id: newComp.id + "-tbCenter",
                parent: newComp.id,
                constraints: "Center",
                name: newComp.name + "-tbCenter",
                className: "ToolBarHelperCenter",
                layout: innerLayout,
                layoutData: newComp.layoutData,
                preferredSize: newComp.preferredSize, 
                minimumSize: newComp.minimumSize, 
                maximumSize: newComp.maximumSize,
                isNavTable: newComp.classNameEventSourceRef === "NavigationTable"
            }

            this.flatContent.set(tbMain.id, tbMain);
            this.flatContent.set(tbCenter.id, tbCenter);
        }
    }

    /**
     * Adds the components parent to a list so it gets notified that its components changed
     * @param comp - the component which is currently being changed (not the parent!)
     * @param notifyList - the list of components which need to be notified (parents)
     */
    addToNotifyList(comp:BaseComponent, notifyList:string[]) {
        if (comp.parent) {
            // If the new component's parent is a toolbar-panel, check which of the artificial parents should be notified (based on ~additional)
            if (this.getParent(comp.parent)?.className === COMPONENT_CLASSNAMES.TOOLBARPANEL) {
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



        componentsToUpdate.forEach(newComponent => {
            /** Checks if the component is a custom component */
            const isCustom:boolean = this.customComponents.has(newComponent.name as string);
            existingComponent = this.getExistingComponent(newComponent.id);

            this.updateExistingComponent(existingComponent, newComponent);

            if (newComponent.className === COMPONENT_CLASSNAMES.TOOLBARPANEL && !isCustom) {
                this.handleToolBarComponent(existingComponent as IToolBarPanel, newComponent as IToolBarPanel);
            }

            /** Cast newComponent as Panel */
            const newCompAsPanel = (newComponent as IPanel);
            
            if (existingComponent) {
                if (newComponent["~remove"] !== true) {
                    /** If the new component is in removedContent, either add it to flatContent or replacedContent if it is custom or not*/
                    if (this.isRemovedComponent(newComponent.id)) {
                        if (!isCustom) {
                            if (desktop) {
                                this.removedDesktopContent.delete(newComponent.id);
                                this.desktopContent.set(newComponent.id, existingComponent);
                            }
                            else {
                                this.removedContent.delete(newComponent.id);
                                this.flatContent.set(newComponent.id, existingComponent);
                            }
                        }
                        else {
                            this.removedCustomComponents.delete(newComponent.id);
                            this.replacedContent.set(newComponent.id, existingComponent);
                        }
                    }
                }
                /** 
                 * If newComponent already exists and has "remove", delete it from flatContent/replacedContent 
                 * and add it to removedContent/removedCustomContent.
                 */

                if (newComponent["~remove"]) {
                    if (!isCustom) {
                        if (desktop) {
                            this.desktopContent.delete(newComponent.id);
                            this.removedDesktopContent.set(newComponent.id, existingComponent);
                        }
                        else {
                            if (existingComponent && existingComponent.className === COMPONENT_CLASSNAMES.INTERNAL_FRAME) {
                                if ((existingComponent as IPanel).screen_navigationName_ || (existingComponent as IPanel).content_className_ ) {
                                    this.closeScreen(existingComponent.name);
                                }
                                else {
                                    const foundWorkScreen = Array.from(this.flatContent.values()).find(comp => comp.parent === existingComponent!.id && 
                                        ((comp as IPanel).screen_navigationName_ !== undefined || (comp as IPanel).content_className_ !== undefined));
                                    if (foundWorkScreen) {
                                        this.flatContent.delete(newComponent.id);
                                        this.closeScreen(foundWorkScreen.name);
                                    }   
                                }
                            }
                            else {
                                this.flatContent.delete(newComponent.id);
                                this.removedContent.set(newComponent.id, existingComponent);
                            }
                        }
                    }
                    else {
                        this.replacedContent.delete(newComponent.id);
                        this.removedCustomComponents.set(newComponent.id, existingComponent);
                    }
                }

                if (newComponent["~destroy"]) {
                    this.flatContent.delete(newComponent.id);
                    this.desktopContent.delete(newComponent.id);
                    this.removedContent.delete(newComponent.id);
                    this.removedDesktopContent.delete(newComponent.id);
                    this.removedCustomComponents.delete(newComponent.id);
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
                if (existingComponent) {
                    this.addToNotifyList(existingComponent, notifyList);
                }
                else if(newComponent.parent) {
                    this.addToNotifyList(newComponent, notifyList);
                }
            }

            if (!existingComponent) {
                if (!isCustom) {
                    if (desktop) {
                        this.desktopContent.set(newComponent.id, newComponent);
                    }
                    else {
                        if (newComponent.className === COMPONENT_CLASSNAMES.TOOLBAR && newComponent.parent?.includes("ML")) {
                            newComponent.parent = newComponent.parent + "-frame-toolbar";
                        }
                        this.flatContent.set(newComponent.id, newComponent);
                    }
                }
                else {
                    // Add the basic properties to the custom component
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
            }
            


            // Set a new selected menuitem to display the menuitem-text in a different color
            if (newCompAsPanel.screen_className_) {
                this.selectedMenuItem = newCompAsPanel.screen_className_
                this.subManager.emitSelectedMenuItem(newCompAsPanel.screen_className_);
            }
        });

        /** If the component already exists and it is subscribed to properties update the state */
        componentsToUpdate.forEach(newComponent => {
            existingComponent = this.getExistingComponent(newComponent.id)

            const updateFunction = this.subManager.propertiesSubscriber.get(newComponent.id);

            if (existingComponent) {
                if (existingComponent.className === COMPONENT_CLASSNAMES.TOOLBARPANEL) {
                    const existingTbMain = this.flatContent.get(existingComponent.id + "-tbMain") || this.removedContent.get(existingComponent.id + "-tbMain");
                    const existingTbCenter = this.flatContent.get(existingComponent.id + "-tbCenter") || this.removedContent.get(existingComponent.id + "-tbCenter");
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
                    updateFunction(existingComponent);
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
    closeScreen(windowName: string, opensAnother?:boolean, closeContent?:boolean) {
        let window = this.getComponentByName(windowName);

        if (window) {
            if (window && !closeContent) {
                this.cleanUp(window.id, window.name, window.className);
            }
        }

        this.activeScreens = this.activeScreens.filter(screen => screen.name !== windowName);
        this.subManager.emitActiveScreens();
        if (this.activeScreens.length) {
            this.subManager.emitSelectedMenuItem(this.activeScreens.slice(-1).pop()!.className as string);
        }
        else if (!opensAnother) {
            this.subManager.emitSelectedMenuItem("");
        }
        

    }

    /**
     * Deletes all children of a parent from flatContent, a child with children also deletes their children from flatContent
     * @param id - the id of the parent
     */
    deleteChildren(id:string, className: string) {
        const children = Array.from(this.getChildren(id, className).values());
        children.forEach((child, i) => {
            this.deleteChildren(child.id, child.className);
            this.flatContent.delete(child.id);   
        });

        this.subManager.parentSubscriber.get(id)?.apply(undefined, []);
    }

    /**
     * Deletes the component from flatContent and removes all data from the contentStore, if the compinent is a popup, close it
     * @param id - the component id
     * @param name - the component name
     */
    cleanUp(id:string, name:string|undefined, className: string) {
        if (name) {
            const parentId = this.getComponentById(id)?.parent;
            this.deleteChildren(id, className);
            this.flatContent.delete(id);
            if (parentId) {
                this.subManager.parentSubscriber.get(parentId)?.apply(undefined, []);
            }

            //only do a total cleanup if there are no more components of that name
            if(!this.getComponentByName(name)) {
                this.dataBooks.delete(name);
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
        this.dataBooks.clear();
        this.activeScreens = [];
        this.selectedMenuItem = "";
        this.toolbarItems = [];
    }

    /**
     * Sets or updates the navigation-name for a screen
     * @param screenName - the name of a screen
     * @param navName - the navigation name of a screen
     */
    setNavigationName(screenName:string, navName:string) {
        let existingMap = this.navigationNames.get(screenName);
        if (existingMap)
            existingMap = navName;
        else
            this.navigationNames.set(screenName, navName);
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
     * Returns the data/properties of a component based on the id
     * @param componentId - the id of the component
     * @returns the data/properties of a component based on the id
     */
    getComponentById(componentId?: string): BaseComponent | undefined {
        if (componentId) {
            const mergedContent = new Map([...this.flatContent, ...this.replacedContent, ...this.desktopContent]);
            const componentEntries = mergedContent.entries();
            let foundEntry: BaseComponent | undefined;
            let entry = componentEntries.next();
            while (!entry.done) {
                if (entry.value[1].id === componentId) {
                    foundEntry = entry.value[1];
                }
                entry = componentEntries.next();
            }
            return foundEntry;
        }
        else {
            return undefined;
        }
    }

    /**
     * Returns the parent of a component as BaseComponent Object or undefined if the parent wasn't found
     * @param parentId - the parent you wish to find
     */
    getParent(parentId:string): BaseComponent|undefined {
        let parent:BaseComponent|undefined = undefined
        const mergedContent = new Map([...this.flatContent, ...this.replacedContent, ...this.desktopContent]);
        if (parentId) {
            parent = mergedContent.get(parentId);
        }
        return parent;
    }

    /**
     * Returns all visible children of a parent, if tabsetpanel also return invisible
     * @param id - the id of the component
     * @returns all visible children of a parent, if tabsetpanel also return invisible
     */
    getChildren(id: string, className?: string): Map<string, BaseComponent> {
        const mergedContent = new Map([...this.flatContent, ...this.replacedContent, ...this.desktopContent]);
        const componentEntries = mergedContent.entries();
        let children = new Map<string, BaseComponent>();
        let entry = componentEntries.next();
        let parentId = id;

        if (className) {
            if (mergedContent.has(parentId) && className.includes("ToolBarHelper")) {
                parentId = mergedContent.get(parentId)!.parent as string
            }
        }

        while (!entry.done) {
            const value = entry.value[1];

            if (parentId && parentId.includes("-frame-tb")) {
                parentId = parentId.substring(0, parentId.indexOf("-"));
            }
            if (value.parent === parentId && !this.removedCustomComponents.has(value.name) && value.className !== COMPONENT_CLASSNAMES.MENUBAR) {
                if (parentId.includes("TP")) {
                    children.set(value.id, value);
                }
                else if (value.visible !== false) {
                    children.set(value.id, value);
                }
            }
            entry = componentEntries.next();
        }
        if (className) {
            if (className === COMPONENT_CLASSNAMES.TOOLBARPANEL) {
                children = new Map([...children].filter(entry => entry[0].includes("-tb")));
            }
            else if (className === COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN) {
                children = new Map([...children].filter(entry => entry[1]["~additional"]));
            }
            else if (className === COMPONENT_CLASSNAMES.TOOLBARHELPERCENTER) {
                children = new Map([...children].filter(entry => !entry[1]["~additional"] && !entry[0].includes("-tb")));
            }
            else if (className === COMPONENT_CLASSNAMES.MOBILELAUNCHER) {
                children = new Map([...children].filter(entry => !entry[1]["~additional"]));
            }
        }
        return children;
    }

    /**
     * Returns true if the frame has toolbars
     * @param id - the id of the frame
     */
    hasToolBars(id:string) {
        const toolbars = this.getChildren(id + "-frame-toolbar");
        if (toolbars.size > 0) {
            return true;
        } 
        return false;
    }

    /**
     * Returns the menubar if there is one
     * @param id - the id of the frame
     */
    getMenuBar(id:string) {
        const mergedContent = [...this.flatContent, ...this.replacedContent, ...this.desktopContent];
        const foundMenu = mergedContent.find(v => v[1].parent === id && v[1].className === COMPONENT_CLASSNAMES.MENUBAR);
        if (foundMenu) {
            return foundMenu[1];
        }
        return undefined;
    } 

    /**
     * Returns the component id of a screen for a component
     * @param id - the id of the component
     * @returns the component id of a screen for a component
     */
    getScreenName(id: string, dataProvider:string) {
        let comp: BaseComponent | undefined = this.flatContent.has(id) ? this.flatContent.get(id) : this.desktopContent.get(id);
        if (comp) {
            while (comp?.parent) {
                if ((comp as IPanel).screen_modal_) {
                    break;
                }
                else if ((comp as IPanel).content_modal_) {
                    return dataProvider ? dataProvider.split("/")[1] : comp.name;
                }

                if (comp?.parent?.includes("IF")) {
                    break;
                }

                comp = this.flatContent.has(comp.parent) ? this.flatContent.get(comp.parent) : this.desktopContent.get(comp.parent);
            }
        }
        return comp?.name
    }

    isPopup(comp:IPanel) {
        if (comp.screen_modal_ || comp.content_modal_) {
            return true;
        }
        return false;
    }

    getScreenDataproviderMap(screenId:string): Map<string, IDataBook>|undefined {
        if (this.dataBooks.has(screenId)) {
            return this.dataBooks.get(screenId);
        }
        return undefined
    }

    getDataBook(screenId:string, dataProvider:string): IDataBook|undefined {
        if (this.getScreenDataproviderMap(screenId)?.has(dataProvider)) {
            return this.getScreenDataproviderMap(screenId)!.get(dataProvider);
        }
        return undefined;
    }

    //Data Provider Management
    /**
     * Sets or updates data of a dataprovider in a map and notifies components which use the useDataProviderData hook.
     * If the dataprovider has a master-reference, it saves its data in a Map, the key is the respective primary key
     * for the data of its master and the value is the data. Additionally there is a key "current" which holds data of the
     * current selected row of the master.
     * If there is no master-reference, it saves the data in a Map with one entry key: "current" value: data 
     * @param screenName - the name of the screen
     * @param dataProvider - the dataprovider
     * @param newDataSet - the new data
     * @param to - to which row will be set/updated
     * @param from - from which row will be set/updated
     * @param referenceKey - the primary key value of the master-reference
     * @param selectedRow - the currently selected row of the master-reference
     */
    updateDataProviderData(
        screenName:string, 
        dataProvider:string, 
        newDataSet: Array<any>, 
        to:number, 
        from:number, 
        treePath?:number[], 
        referenceKey?:string,
        recordFormat?: RecordFormat,
        clear?:boolean
    ) {
        const compPanel = this.getComponentByName(screenName) as IPanel;
        
        const fillDataMap = (mapProv:Map<string, any>, mapScreen?:Map<string, IDataBook>, addDPD?:boolean) => {
            if (referenceKey !== undefined) {
                mapProv.set(referenceKey, newDataSet)
            } else {
                mapProv.set("current", newDataSet);
            }
            if (mapScreen) {
                if (mapScreen.has(dataProvider)) {
                    (mapScreen.get(dataProvider) as IDataBook).data = mapProv;
                }
                else {
                    mapScreen.set(dataProvider, {data: mapProv});
                }
                
                if (addDPD) {
                    this.dataBooks.set(screenName, mapScreen);
                }
            }
        }

        if (clear) {
            this.clearDataFromProvider(screenName, dataProvider);
        }

        const existingMap = this.getScreenDataproviderMap(screenName);
        if (existingMap) {
            const existingProvider = this.getDataBook(screenName, dataProvider);
            if (existingProvider && existingProvider.data) {
                const existingData = referenceKey ? existingProvider.data.get(referenceKey) : existingProvider.data.get("current");
                if (existingData) {
                    if (existingData.length <= from) {
                        existingData.push(...newDataSet);
                    } 
                    else {
                        let newDataSetIndex = 0;
                        for(let i = from; i <= to; i++) {
                            if (newDataSet[newDataSetIndex].recordStatus === "I") {
                                this.insertDataProviderData(screenName, dataProvider)
                            }
                            existingData[i] = newDataSet[newDataSetIndex];
                            newDataSetIndex++;
                        }
                    }
                } 
                else {
                    fillDataMap(existingProvider.data);
                }
            } 
            else {
                if (compPanel && this.isPopup(compPanel) && this.getDataBook(dataProvider.split('/')[1], dataProvider)?.data) {
                    fillDataMap((this.getDataBook(dataProvider.split('/')[1], dataProvider) as IDataBook).data as Map<string, any>, existingMap);
                }
                else {
                    const providerMap = new Map<string, Array<any>>();
                    fillDataMap(providerMap, existingMap);
                }
            }
        }
        else {
            const dataMap = new Map<string, IDataBook>();
            if (compPanel && this.isPopup(compPanel) && this.getDataBook(dataProvider.split('/')[1], dataProvider)?.data) {
                fillDataMap((this.getDataBook(dataProvider.split('/')[1], dataProvider) as IDataBook).data as Map<string, any>, dataMap, true);
            }
            else {
                const providerMap = new Map<string, Array<any>>();
                fillDataMap(providerMap, dataMap, true);
            }
        }
        this.subManager.notifyDataChange(screenName, dataProvider);
        this.subManager.notifyScreenDataChange(screenName);
        if (compPanel && this.isPopup(compPanel) && this.getScreenDataproviderMap(dataProvider.split('/')[1])) {
            this.subManager.notifyDataChange(dataProvider.split('/')[1], dataProvider);
            this.subManager.notifyScreenDataChange(dataProvider.split('/')[1]);
        }
    }

    /**
     * Inserts a new datarow into an existing dataset. Always inserts the datarow into the next row of the selected-row.
     * If there is no row selected, the row is inserted at index 0.
     * @param screenName - the name of the screen
     * @param dataProvider - the dataprovider 
     * @param referenceKey - the primary key value of the master-reference
     */
    insertDataProviderData(screenName:string, dataProvider:string, referenceKey?:string) {
        const existingMap = this.getScreenDataproviderMap(screenName);
        if (existingMap) {
            const existingProvider = this.getDataBook(screenName, dataProvider);
            if (existingProvider && existingProvider.data) {
                const existingData = referenceKey ? existingProvider.data.get(referenceKey) : existingProvider.data.get("current");
                if (existingData) {
                    const selectedRow = this.getDataBook(screenName, dataProvider)?.selectedRow;
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
     * @param screenName - the name of the screen
     * @param dataProvider - the dataprovider 
     * @param referenceKey - the primary key value of the master-reference
     */
    deleteDataProviderData(screenName:string, dataProvider:string, index?:number, referenceKey?:string) {
        const existingMap = this.getScreenDataproviderMap(screenName);
        if (existingMap) {
            const existingProvider = this.getDataBook(screenName, dataProvider);
            if (existingProvider && existingProvider.data) {
                const existingData = referenceKey ? existingProvider.data.get(referenceKey) : existingProvider.data.get("current");
                if (existingData) {
                    if (index) {
                        existingData.splice(index, 1);
                    }
                    else {
                        const selectedRow = this.getDataBook(screenName, dataProvider)?.selectedRow;
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
     * @param screenName - the name of a screen
     * @param dataProvider - the dataprovider
     * @param from - from which row to return
     * @param to - to which row to return
     * @returns either a part of the data of a dataprovider specified by "from" and "to" or all data
     */
    getData(screenName:string, dataProvider: string, from?: number, to?: number): Array<any>{
        let dataArray:any = this.getDataBook(screenName, dataProvider)?.data;
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
     * @param screenName - the name of a screen
     * @param dataProvider - the dataprovider
     * @param indexOfRow - the index of the row to get
     * @returns either the dataRow of a dataprovider with the given index or undefined if row has not been found
     */
    getDataRow(screenName:string, dataProvider: string, indexOfRow: number) : any{
        const data = this.getData(screenName, dataProvider);
        const dataRow = data[indexOfRow];
        if(dataRow)
            return dataRow;
        else
            return undefined
    }

    /**
     * Sets or updates the currently selectedRow of a dataprovider
     * @param screenName - the name of a screen
     * @param dataProvider - the dataprovider
     * @param dataRow - the selectedDataRow
     */
    setSelectedRow(screenName:string, dataProvider: string, dataRow: any, index:number, treePath?:TreePath, selectedColumn?:string) {
        const compPanel = this.getComponentByName(screenName) as IPanel;
        const existingMap = this.getScreenDataproviderMap(screenName);
        if (existingMap) {
            if (existingMap.has(dataProvider)) {
                (existingMap.get(dataProvider) as IDataBook).selectedRow = {dataRow: dataRow, index: index, treePath: treePath, selectedColumn: selectedColumn};
            }
            else {
                if (compPanel && this.isPopup(compPanel) && this.getDataBook(dataProvider.split('/')[1], dataProvider)?.selectedRow) {
                    let popupSR:IDataBook = {selectedRow: this.getDataBook(dataProvider.split('/')[1], dataProvider)!.selectedRow };
                    popupSR.selectedRow = {dataRow: dataRow, index: index, treePath: treePath, selectedColumn: selectedColumn}
                    existingMap.set(dataProvider, popupSR);
                }
                else {
                    existingMap.set(dataProvider, {selectedRow: {dataRow: dataRow, index: index, treePath: treePath, selectedColumn: selectedColumn}});
                }
            }
        }
        else {
            const tempMapRow = new Map<string, IDataBook>();
            if (compPanel && this.isPopup(compPanel) && this.getDataBook(dataProvider.split('/')[1], dataProvider)?.selectedRow) {
                let popupSR:IDataBook = {selectedRow: this.getDataBook(dataProvider.split('/')[1], dataProvider)!.selectedRow };
                popupSR.selectedRow = {dataRow: dataRow, index: index, treePath: treePath, selectedColumn: selectedColumn}
                tempMapRow.set(dataProvider, popupSR);
            }
            else {
                tempMapRow.set(dataProvider, {selectedRow: {dataRow: dataRow, index: index, treePath: treePath, selectedColumn: selectedColumn}});
            }
            this.dataBooks.set(screenName, tempMapRow);
        }
        this.subManager.emitRowSelect(screenName, dataProvider);
        if (compPanel && this.isPopup(compPanel) && this.getScreenDataproviderMap(dataProvider.split('/')[1])) {
            this.subManager.emitRowSelect(dataProvider.split('/')[1], dataProvider);
        }
    }

    /**
     * Clears the selectedRow of a dataProvider
     * @param screenName - the name of the screen
     * @param dataProvider - the dataprovider
     */
    clearSelectedRow(screenName:string, dataProvider: string) {
        const compPanel = this.getComponentByName(screenName) as IPanel;
        if (this.getDataBook(screenName, dataProvider)) {
            this.getDataBook(screenName, dataProvider)!.selectedRow = undefined;
            this.subManager.emitRowSelect(screenName, dataProvider);
            if (compPanel && this.isPopup(compPanel) && this.getScreenDataproviderMap(dataProvider.split('/')[1])) {
                this.subManager.emitRowSelect(dataProvider.split('/')[1], dataProvider);
            }
        }
    }

    /**
     * Clears the data from every subpage of a dataprovider
     * @param screenName - the name of the screen 
     * @param detailReferences - the detail references of a master reference
     */
    clearDataFromSubPage(screenName:string, detailReferences?:MetaDataReference[]) {
        const compPanel = this.getComponentByName(screenName) as IPanel;
        if (detailReferences !== undefined) {
            detailReferences.forEach(reference => {
                const referencedDataBook = reference.referencedDataBook;
                const metaData = getMetaData(screenName, referencedDataBook, this, undefined);
                const dataBookData = this.getDataBook(screenName, referencedDataBook)?.data;
                if (dataBookData) {
                    for (let [key] of dataBookData) {
                        if (key !== "current") {
                            dataBookData.delete(key);
                        }
                    }
                }
                if (metaData && metaData.detailReferences) {
                    this.clearDataFromSubPage(screenName, metaData.detailReferences);
                }
                this.subManager.notifyDataChange(screenName, referencedDataBook);
                this.subManager.notifyScreenDataChange(screenName);
                if (compPanel && this.isPopup(compPanel) && this.getScreenDataproviderMap(referencedDataBook.split('/')[1])) {
                    this.subManager.notifyDataChange(referencedDataBook.split('/')[1], referencedDataBook);
                    this.subManager.notifyScreenDataChange(referencedDataBook.split('/')[1]);
                }
            });
        }
    }

    /**
     * Clears the data of a dataProvider
     * @param screenName - the name of the screen
     * @param dataProvider - the dataprovider
     */
    clearDataFromProvider(screenName:string, dataProvider: string) {
        const data = this.getDataBook(screenName, dataProvider)?.data;
        const metaData = getMetaData(screenName, dataProvider, this, undefined);
        if (data) {
            data.delete("current");
        }
        
        if (metaData && metaData.masterReference === undefined) {
            this.clearDataFromSubPage(screenName, metaData.detailReferences);
        }
    }

    /**
     * Sets or updates the sort-definitions of a dataprovider in a map and then notifies the
     * components which use the useSortDefinitions hook to update their state.
     * @param screenName - the name of the screen
     * @param dataProvider - the dataprovider
     * @param sortDefinitions - the sort-definitions
     */
    setSortDefinition(screenName: string, dataProvider: string, sortDefinitions: SortDefinition[]) {
        const compPanel = this.getComponentByName(screenName) as IPanel;
        const existingMap = this.getScreenDataproviderMap(screenName);

        if (existingMap) {
            if (existingMap.has(dataProvider)) {
                (existingMap.get(dataProvider) as IDataBook).sortedColumns = sortDefinitions;
            }
            else {
                if (compPanel && this.isPopup(compPanel) && this.getDataBook(dataProvider.split('/')[1], dataProvider)?.sortedColumns) {
                    let popupSD:IDataBook = {sortedColumns: this.getDataBook(dataProvider.split('/')[1], dataProvider)?.sortedColumns};
                    popupSD.sortedColumns = sortDefinitions;
                    existingMap.set(dataProvider, popupSD);
                }
                else {
                    existingMap.set(dataProvider, {sortedColumns: sortDefinitions});
                }
            }
        }
        this.subManager.notifySortDefinitionChange(screenName, dataProvider);
        if (compPanel && this.isPopup(compPanel) && this.getScreenDataproviderMap(dataProvider.split('/')[1])) {
            this.subManager.notifySortDefinitionChange(dataProvider.split('/')[1], dataProvider);
        }
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

    setWsAndTimer(ws:WebSocket, timer:Timer) {
        this.ws = ws;
        this.timer = timer
    }

    restartAliveSending(newMs:number) {
        if (this.ws && this.timer) {
            this.timer.reset(newMs);
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