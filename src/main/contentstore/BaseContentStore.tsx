/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { ReactElement } from "react";
import { History } from "history";
import SignaturePad, { ISignaturPad } from "../components/custom-comp/custom-container-components/SignaturePad";
import TreePath from "../model/TreePath";
import { SubscriptionManager } from "../SubscriptionManager";
import IBaseComponent from "../util/types/IBaseComponent";
import { IToolBarPanel } from "../components/panels/toolbarPanel/UIToolBarPanel";
import { IToolBarHelper } from "../components/panels/toolbarPanel/UIToolBarHelper";
import COMPONENT_CLASSNAMES from "../components/COMPONENT_CLASSNAMES";
import { componentHandler } from "../factories/UIFactory";
import { IChangedColumns } from "../response/data/DataProviderChangedResponse";
import MetaDataResponse, { LengthBasedColumnDescription, MetaDataReference } from "../response/data/MetaDataResponse";
import { SortDefinition } from "../request/data/SortRequest";
import { ScreenWrapperOptions } from "../util/types/custom-types/ScreenWrapperType";
import CustomStartupProps from "../util/types/custom-types/CustomStartupProps";
import { IPanel } from "../components/panels/panel/UIPanel";
import { getMetaData } from "../util/data-util/GetMetaData";
import AppSettings from "../AppSettings";
import BaseServer from "../server/BaseServer";
import CELLEDITOR_CLASSNAMES from "../components/editors/CELLEDITOR_CLASSNAMES";
import { ICellEditorLinked } from "../components/editors/linked/UIEditorLinked";
import FetchRequest from "../request/data/FetchRequest";
import * as _ from "underscore"
import { Designer } from "../../MiddleMan";

// Type for ActiveScreens
export type ActiveScreen = {
    name: string,
    id: string,
    className?: string
    navigationName?: string
    popup?: boolean,
    title?: string
}

// Interface for selected-rows
export interface ISelectedRow {
    dataRow: any,
    index: number,
    treePath?: TreePath,
    selectedColumn?: string
}

// Interface for Databooks
export interface IDataBook {
    data?: Map<string, any>,
    metaData?: MetaDataResponse,
    isAllFetched?: boolean,
    selectedRow?: ISelectedRow,
    sortedColumns?: SortDefinition[],
    readOnly?: boolean,
    referencedCellEditors?: {cellEditor: any, columnName: string, dataBook:string}[],
    rootKey?: string,
    contentId?: string
}

/** The ContentStore stores active content like user, components and data*/
export default abstract class BaseContentStore {
    /** SubscriptionManager instance */
    abstract subManager:SubscriptionManager;

    /** AppSettings instance */
    abstract appSettings: AppSettings;

    /** Server instance */
    abstract server: BaseServer;

    /** VisionX Designer instance */
    abstract designer: Designer|null;

    /** A Map which stores the component which are sent by the server and not removed, the key is the components id and the value the component */
    flatContent = new Map<string, IBaseComponent>();

    /** A Map which stores the children of components, the key is the id of the component and the value is a set of the children id's */
    componentChildren = new Map<string, Set<string>>();

    /** A Map which stores the component which are displayed in the desktop-panel, the key is the components id and the value the component */
    desktopContent = new Map<string, IBaseComponent>();

    /** A Map which stores removed, but not deleted components, the key is the components id and the value the component */
    removedContent = new Map<string, IBaseComponent>();

    /** A Map which stores removed, but not deleted components of the desktop-panel, the key is the components id and the value the component */
    removedDesktopContent = new Map<string, IBaseComponent>();

    /** A Map which stores custom-screens made by the user, the key is the components title and the value a function to build the custom-screen*/
    customScreens = new Map<string, Function>();

    /** A Map which stores custom components made by the user, the key is the components title and the value a function to build the component*/
    customComponents = new Map<string, Map<string, Function>>();

    /** A Map which stores replace-screens made by the user, the key is the components title and the value a function to build the replace-screen*/
    replaceScreens = new Map<string, Function>();

    /** A map which stores removed custom components made by the user, the key is the components title and the value is the component-object */
    removedCustomComponents = new Map<string, IBaseComponent>();

    /** A Map which stores custom components which replace components sent by the server, the key is the components id and the value the component */
    replacedContent = new Map<string, IBaseComponent>();

    /** A Map which stores the navigation names for screens to route, the key is the navigation name of the screen and the value is an object containing the screenId and the componentId */
    navigationNames = new Map<string, { screenId: string, componentId: string}>();

    /** A Map which stores application parameters sent by the server, the key is the property and the value is the value */
    customProperties = new Map<string, any>();

    /** A Map which stores screeen-wrapper names for screens, key is the screen-name and the value is the object of the screen-wrapper */
    screenWrappers = new Map<string, {wrapper: ReactElement, options: ScreenWrapperOptions}>();

    //DataProvider Maps stores the data, selectedRow, selectedColumn etc. for databooks per screen.
    dataBooks = new Map<string, Map<string, IDataBook>>();

    // An array of custom-startup-properties which are sent to the server on startup
    customStartUpProperties = new Array<CustomStartupProps>();

    /** The currently active screens usually only one screen but with popups multiple possible */
    activeScreens:ActiveScreen[] = [];

    /** Screens which have not received a closeScreen from the server but still need to be closed via closeScreen request later */
    inactiveScreens: string[] = [];

    /** the react routers history object */
    history?:History<any>;

    /** Global components are extra components which are not available in VisionX but are displayable client-side */
    addedComponents:Map<string, Function> = new Map<string, Function>().set("SignaturePad", (props: ISignaturPad) => <SignaturePad {...props} />);

    /** The title of the tab in the browser */ 
    tabTitle: string = "";

    /** The title in the menu topbar sent by the server */
    topbarTitle: string = "";

    /** An array of the history of screens which have been opened, used to reopen them when a screen has been closed */
    screenHistory:Array<{ componentId: string, className: string }> = [];

    /** The id and className of the last focused component, used to refocus it eg. when a popup is closed */
    lastFocusedComponent:{id: string, className: string}|undefined = undefined;

    /** An array of component-names which are created by the designer when dragging them in */
    designerCreatedComponents: string[] = []

    /**
     * Initiates a contentstore instance
     * @param history - the history
     */
    constructor(history?:History<any>) {
        this.history = history;
    }

    /**
     * Sets the Subscription-Manager instance
     * @param subManager - the subscription-manager instance 
     */
    setSubscriptionManager(subManager:SubscriptionManager) {
        this.subManager = subManager;
    }

    /**
     * Sets the AppSettings instance
     * @param appSettings - the appsettings instance
     */
    setAppSettings(appSettings:AppSettings) {
        this.appSettings = appSettings;
    }

    /**
     * Sets the server instance
     * @param server - the server instance
     */
    setServer(server:BaseServer) {
        this.server = server
    } 

    /**
     * Sets the custom-startup-properties
     * @param arr - an array of custom-startup-properties
     */
    setStartupProperties(arr:CustomStartupProps[]) {
        this.customStartUpProperties = [...this.customStartUpProperties, ...arr];
    }

    /**
     * Returns the properties of a component based on the name
     * @param componentName - the name of the component
     * @param withRemoved - optional, also looks for the component in removed content
     * @returns the data/properties of a component based on the name
     */
     getComponentByName(componentName: string, withRemoved?:boolean): IBaseComponent | undefined {
        let alreadyFound = false;
        let mergedContent = new Map([...this.flatContent, ...this.replacedContent, ...this.desktopContent]);

        // also check removed content
        if (withRemoved) {
            mergedContent = new Map([...mergedContent, ...this.removedContent]);
        }

        const componentEntries = mergedContent.entries();
        let foundEntry:IBaseComponent|undefined;
        let entry = componentEntries.next();
        while (!entry.done) {
            if (entry.value[1].name === componentName && !entry.value[1].invalid) {
                // Logs, if a components name isn't unique, this indicates either server issues, or issues with removing components
                if (alreadyFound) {
                    console.warn("Component 'name' is not unique (" + componentName + ")");
                }
                foundEntry = entry.value[1];
                alreadyFound = true;
            }
            entry = componentEntries.next();
        }
        return foundEntry;
    }

    /**
     * Returns the properties of a component based on the id
     * @param componentId - the id of the component, undefineable because parent could be undefined
     * @returns the properties of a component based on the id
     */
    getComponentById(componentId?: string): IBaseComponent | undefined {
        if (componentId) {
            return this.flatContent.get(componentId) 
                ?? this.replacedContent.get(componentId) 
                ?? this.desktopContent.get(componentId);
        }
        else {
            return undefined;
        }
    }

    /**
     * Returns the parent of a component as IBaseComponent Object or undefined if the parent wasn't found
     * @param parentId - the parent you wish to find
     */
    getParent(parentId:string): IBaseComponent|undefined {
        let parent:IBaseComponent|undefined = undefined
        const mergedContent = new Map([...this.flatContent, ...this.replacedContent, ...this.desktopContent]);
        if (parentId) {
            parent = mergedContent.get(parentId);
        }
        return parent;
    }

    /**
     * Adds a component to the children list of it's parent, if there is no entry for the parent an entry is created.
     * Also handles the toolbarpanel helpers
     * @param child - the component which is being added.
     */
    addAsChild(child: IBaseComponent) {
        if (child.parent) {
            // Get the list of the parent
            const children:Array<string> = this.componentChildren.has(child.parent) ? Array.from(this.componentChildren.get(child.parent) as Set<string>) : new Array<string>();
            let component = child;

            // If the parent is a toolbarpanel, add the reactUI exclusive components tbMain and tbCenter to it's list of children
            if (child.parent.includes("TBP")) {
                let string = component.parent;
                if (component["~additional"]) {
                    string = component.parent + "-tbMain"
                }
                else {
                    string = component.parent + "-tbCenter"
                }
                const tbpChildren = this.componentChildren.get(string) || new Set<string>();
                tbpChildren.add(component.id);
                this.componentChildren.set(string, tbpChildren);
                // add child at correct indexOf position
                if (component.indexOf !== undefined) {
                    children.splice(component.indexOf, 0, string);
                }
                else {
                    children.push(string)
                }
                
            }
            else {
                // add child at correct indexOf position
                if (component.indexOf !== undefined) {
                    children.splice(component.indexOf, 0, component.id);
                }
                else {
                    children.push(component.id)
                }
            }
            this.componentChildren.set(child.parent, new Set(children));
        }
    }

    /**
     * Removes a component from it's parent's list of children. Also handles toolbarpanel helpers.
     * @param child - the component which is being removed
     */
    removeAsChild(child: IBaseComponent) {
        if (child.parent) {
            const children:Set<string> = this.componentChildren.get(child.parent) || new Set<string>();
            // If the parent is a toolbarpanel, remove the reactUI exclusive components tbMain and tbCenter from it's list of children
            if (child.parent.includes("TBP")) {
                let component = child;
                if (this.getExistingComponent(child.id)) {
                    component = this.getExistingComponent(child.id) as IBaseComponent;
                }
                let string = component.parent;
                if (component["~additional"]) {
                    string = component.parent + "-tbMain"
                }
                else {
                    string = component.parent + "-tbCenter"
                }
                const tbpChildren = this.componentChildren.get(string) || new Set<string>();
                tbpChildren.delete(component.id);
                this.componentChildren.set(string, tbpChildren);
                children.delete(string);
            }
            else {
                children.delete(child.id);
            }
            this.componentChildren.set(child.parent, children);
        }
    }

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
     * @param id - the id of the component
     */
     isRemovedComponent(id:string) {
        return this.removedContent.has(id) || this.removedCustomComponents.has(id) || this.removedDesktopContent.has(id);
    }

    /**
     * Updates a components properties when the server sends new properties
     * @param existingComp - the existing component already in contentstore
     * @param newComp - the new component of changedcomponents
     * @param notifyList - a list of component-names to notify them, that their children changed
     */
    abstract updateExistingComponent(existingComp:IBaseComponent|undefined, newComp:IBaseComponent, notifyList: string[]): void

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
     * Updates the properties of the reactUI exclusive popup wrapper component
     * @param existingComp - the existing inner component (not wrapper)
     * @param newComp - the new inner component
     * @param newProp - the name of the property (not value)
     */
    updatePopupProperties(existingComp:IPanel, newComp:IPanel, newProp:string) {
        const popup = this.getExistingComponent(existingComp.id + "-popup") as IPanel;
        if (newProp !== "id") {
            // @ts-ignore
            popup[newProp] = newComp[newProp];
        }
    }

    /**
     * Handles adding or removing popups
     * @param existingComp - the previous component before the update
     * @param newComp - the updated component
     */
    handleModalPanel(existingComp:IPanel|undefined, newComp:IPanel) {
        if (existingComp) {
            const popup = this.getExistingComponent(existingComp.id + "-popup");
            if (newComp["~remove"] !== true) {
                if (this.isRemovedComponent(existingComp.id)) {
                    if (popup) {
                        this.removedContent.delete(existingComp.id + "-popup");
                        this.flatContent.set(existingComp.id + "-popup", popup);
                    }
                }
            }
            else {
                if (popup) {
                    this.flatContent.delete(existingComp.id + "-popup");
                    this.removedContent.set(existingComp.id + "-popup", popup);
                }
            }

            if (newComp["~destroy"]) {
                this.flatContent.delete(existingComp.id + "-popup");
                this.removedContent.delete(existingComp.id + "-popup");
            }
            if (newComp.parent?.startsWith("IF")) {
                existingComp.parent = existingComp.id + "-popup"
            }
        }
        else {
            const popup:IBaseComponent = {
                ...newComp,
                id: newComp.id + "-popup",
                name: newComp.name + "-popup",
                className: "PopupWrapper"
            }
            newComp.parent = popup.id;
            this.flatContent.set(popup.id, popup);
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
     addToNotifyList(comp:IBaseComponent, notifyList:string[]) {
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

    /** Filter function for notifyList */
    onlyUniqueFilter(value: string, index: number, self: Array<string>) {
        return self.indexOf(value) === index;
    }

    /**
     * Sets or updates flatContent, removedContent, replacedContent, updates properties and notifies subscriber
     * that either a popup should be displayed, properties changed, or their parent changed, based on server sent components
     * @param componentsToUpdate - an array of components sent by the server
     * @param desktop - true, if the changes happpen to the desktoppanel
     */
    abstract updateContent(componentsToUpdate: Array<IBaseComponent>, desktop:boolean): void;

    /**
     * Sets the currently active screens or clears the array
     * @param screenInfo - the screen-info of the newly opened screen or nothing to clear active screens
     * @param popup - true, if the newly opened screen is a popup
     */
    abstract setActiveScreen(screenInfo?:ActiveScreen, popup?:boolean): void;

    /**
     * Handles what should happen when a screen is being closed
     * @param windowId - the id of the window to close
     * @param windowName - the name of the window to close
     * @param closeDirectly - If true, immediately clean up the data and clear the activeScreens
     */
     closeScreen(windowId: string, windowName: string, closeDirectly?:boolean) {
        this.activeScreens = this.activeScreens.filter(screen => screen.id !== windowId);
        // If a popup is closed or the homebutton was pressed, clean up the screen and update activescreens.
        if (closeDirectly || this.server.homeButtonPressed) {
            let window = this.getComponentById(windowId);
            if (window) {
                this.cleanUpUI(window.id, window.name, window.className, closeDirectly);
            }
            this.subManager.emitActiveScreens();
            this.server.homeButtonPressed = false;
        }
        else {
            // Add the screens that need to be closed to an array, so it doesn't get immediately closed incase another screen gets opened to prevent flickering
            // It later gets closed, when the server sends the next responses and the client is done handling them.
            // Rather use id than name because the name could appear more than once when the homescreen gets opened by the server AND by client via maybeopenscreen.
            if (windowId) {
                this.server.screensToClose.push({ windowId: windowId, windowName: windowName, closeDirectly: closeDirectly });
            }
            
            // If there is a screen to open and there are currently no screens open, the maybeOpenScreen is not the screen to close and the window to close is not the homescreen
            // Ignore the home property sent by the server which would open the home-screen.
            if (this.server.screensToClose.length 
                && this.server.maybeOpenScreen 
                && !this.activeScreens.length 
                && this.server.maybeOpenScreen.componentId !== windowId
                && windowName !== this.appSettings.homeScreen) {
                this.server.ignoreHome = true;
            }
        }
        this.cleanUpData(windowName)           
    }

    /**
     * Deletes all children of a parent from flatContent, a child with children also deletes their children from flatContent
     * @param id - the id of the parent
     * @param className - the classname of the component
     */
     deleteChildren(id:string, className: string) {
        const children = this.getAllChildren(id, className);
        children.forEach(child => {
            this.deleteChildren(child.id, child.className);
            this.flatContent.delete(child.id);
        });
    }

    /**
     * Removes all databooks of a screen and all rowSubscribers
     * @param name - the name of the screen to be cleaned up
     */
    cleanUpData(name:string|undefined) {
        if (name) {
            this.dataBooks.delete(name);
            this.subManager.rowSelectionSubscriber.delete(name);
        }
    }

    /**
     * Deletes all components from a screen
     * @param id - the window id
     * @param name - the window name
     * @param className - the className of the component to close
     * @param closeDirectly - If true, also remove components from the removedContent
     */
     cleanUpUI(id:string, name:string|undefined, className: string, closeDirectly?:boolean) {
        if (name) {
            const parentId = this.getComponentById(id)?.parent;
            this.deleteChildren(id, className);
            this.flatContent.delete(id);

            if (closeDirectly) {
                this.removedContent.delete(id)
            }

            if (parentId) {
                this.subManager.parentSubscriber.get(parentId)?.apply(undefined, []);
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
        this.navigationNames.clear();
        this.screenWrappers.clear();
        this.dataBooks.clear();
        this.screenHistory = [];
        this.activeScreens = [];
    }

    /**
     * Sets or updates the navigation-name for a screen
     * @param navName - the navigation name of a screen
     * @param componentId - the componentId to add a screen
     */
     setNavigationName(navName:string, componentId: string, name?:string) {
        let existingNav = this.navigationNames.get(navName);
        if (existingNav) {
            existingNav.componentId = componentId;
        }
        else {
            this.navigationNames.set(navName, { componentId: componentId, screenId: name ? name : "" });
        }
            
    }

    /**
     * Creates and returns the react-elements to render a screen
     * @param window - the window as active-screen
     * @returns the built window
     */
     getWindow(window: ActiveScreen) {
         let windowData: IBaseComponent | undefined;
        if (window.popup) {
            windowData = this.getComponentById(window.id);

        }
        else {
            windowData = this.getComponentByName(window.name);
        }

        // If the screen to build is a replace-screen, call the function to render the replace screen,
        // else if there is windowData render the reactui screen else if it is a custom screen, render the custom-screen set by a lib-user
        if (this.replaceScreens.has(window.name)) {
            return this.replaceScreens.get(window.name)?.apply(undefined, [{ screenName: window.name }]);
        }
        else if (windowData) {
            return componentHandler(windowData, this);
        }
        else if (this.customScreens.has(window.name)) {
            return this.customScreens.get(window.name)?.apply(undefined, [{ screenName: window.name }]);
        }

    }

    /**
     * Validates a component and it's children. 
     * @param component - the component which gets validated
     */
    validateComponent(component:IBaseComponent) {
        let parent = component.parent;
        let invalid = false;
        while (parent && !parent.includes("IF")) {
            const parentComp = this.getComponentById(parent);
            if (parentComp && parentComp.visible !== false && parentComp.invalid !== true) {
                parent = parentComp.parent;
            }
            else {
                invalid = true;
                break;
            }
        }

        if (!invalid) {
            component.invalid = false;
        }

        const children = this.getAllChildren(component.id, component.className);

        children.forEach(child => {
            this.validateComponent(child);
        })
    }

    /**
     * Recursively invalidates the children of a component, so they aren't used anymore
     * @param id - the id of the component which get's it's children invalidated
     * @param className - the classname of the component
     */
    invalidateChildren(id:string, className?:string) {
        const children = this.getAllChildren(id, className);

        children.forEach(child => {
            child.invalid = true;
            this.invalidateChildren(child.id, child.className);
        })
    }

    /**
     * Returns all visible children of a parent, if tabsetpanel also return invisible
     * @param id - the id of the component
     * @param className - optional, the className of the component
     */
    abstract getChildren(id: string, className?: string): Map<string, IBaseComponent>;

    /**
     * Returns all visible children of a parent also invisible ones
     * @param id - the id of the component
     * @param className - optional, the className of the component
     */
    abstract getAllChildren(id:string, className?: string): Map<string, IBaseComponent>;

    /**
     * Returns the component id of a screen for a component
     * @param id - the id of the component
     * @param dataProvider - optional, the dataProvider of a component, can be used to get the screen name faster
     * @returns the component id of a screen for a component
     */
     getScreenName(id: string, dataProvider?:string) {
        if (dataProvider) {
            const splitDataProvider = dataProvider.split("/");
            return splitDataProvider[1]
        }
        else {
            let comp: IBaseComponent | undefined = this.flatContent.has(id) ? this.flatContent.get(id) : this.desktopContent.get(id);
            if (comp) {
                // go the parents of components upwards to get to the screen component to get it's name
                while (comp?.parent) {
                    if ((comp as IPanel).screen_modal_ || (comp as IPanel).screen_navigationName_) {
                        break;
                    }
                    else if ((comp as IPanel).content_className_) {
                        if (dataProvider) {
                            const splitDataProvider = dataProvider.split("/");
                            return splitDataProvider[1]
                        }
                        return comp.name;
                    }
    
                    comp = this.flatContent.has(comp.parent) ? this.flatContent.get(comp.parent) : this.desktopContent.get(comp.parent);
                }
            }
            if (comp?.nameComponentRef) {
                return comp.nameComponentRef;
            }
            return comp?.name;
        }
    }

    /**
     * Returns true if the component is a popup or content
     * @param comp - the component
     */
    isPopup(comp:IPanel) {
        if (comp.screen_modal_ || comp.content_modal_) {
            return true;
        }
        return false;
    }

    /**
     * Returns the databooks of a screen as map
     * @param screenName - the screen-name
     */
    getScreenDataproviderMap(screenName:string): Map<string, IDataBook>|undefined {
        if (this.dataBooks.has(screenName)) {
            return this.dataBooks.get(screenName);
        }
        return undefined;
    }

    /**
     * Sets the databook, creates one if there is none or updates a current one
     * @param screenName - the name of the screen
     * @param dataProvider - the name of the dataProvider
     * @param pDataBook - the databook to add
     */
    setDataBook(screenName: string, dataProvider: string, pDataBook: IDataBook): void {
        if (!this.dataBooks.has(screenName)) {
            this.dataBooks.set(screenName, new Map<string, IDataBook>().set(dataProvider, pDataBook))
        }
        else {
            let dataBook = this.dataBooks.get(screenName)!.get(dataProvider);
            if (dataBook) {
                dataBook = {...dataBook, ...pDataBook}
            }
            else {
                this.dataBooks.get(screenName)!.set(dataProvider, pDataBook);
            }
        }
    }

    /**
     * Returns the databook of a specific screen and dataprovider
     * @param screenName - the screen-name
     * @param dataProvider - the dataprovider
     */
    getDataBook(screenName:string, dataProvider:string): IDataBook|undefined {
        if (this.getScreenDataproviderMap(screenName)?.has(dataProvider)) {
            return this.getScreenDataproviderMap(screenName)!.get(dataProvider);
        }
        return undefined;
    }

    //Data Provider Management

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
            // current is the currently selected datapage
            dataArray = dataArray.get("current")
            if(from !== undefined && to !== undefined) {
                return dataArray?.slice(from, to) || [];
            }
        }
        return  dataArray || [];
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
     * Sets or updates data of a dataprovider in a map and notifies components which use the useDataProviderData hook.
     * If the dataprovider has a master-reference, it saves its data in a Map, the key is the respective primary key
     * for the data of its master and the value is the data. Additionally there is a key "current" which holds data of the
     * current selected datapage
     * If there is no master-reference, it saves the data in a Map with one entry key: "current" value: data 
     * @param screenName - the name of the screen
     * @param dataProvider - the dataprovider
     * @param newDataSet - the new data
     * @param to - to which row will be set/updated
     * @param from - from which row will be set/updated
     * @param isAllFetched - true, if all data has been fetched from the dataprovider
     * @param masterRow - an array of the masterrow used in master-detail relations
     * @param clear - clears the data from the dataprovider
     * @param request - the request which led to updating the data
     */
     updateDataProviderData(
        screenName:string, 
        dataProvider:string, 
        newDataSet: Array<any>, 
        to:number, 
        from:number,
        isAllFetched?: boolean,
        masterRow?:any[],
        clear?:boolean,
        request?:FetchRequest
    ) {
        const compPanel = this.getComponentByName(screenName) as IPanel;
        const metaData = this.dataBooks.get(screenName)?.get(dataProvider)?.metaData;

        /** Returns the key which is used to access a datapage */
        const getPageKey = () => {
            let pageKey:string = "";
            if (metaData) {
                if (!metaData.masterReference || masterRow === undefined) {
                    pageKey = "current"
                }
                else {
                    if (masterRow && masterRow.length === 0) {
                        pageKey = "noMasterRow";
                    }
                    else {
                        let pageKeyObj:any = {};
                        for (let i = 0; i < metaData.masterReference.columnNames.length; i++) {
                            //if (masterRow[i] !== null && masterRow[i] !== undefined) {
                                pageKeyObj[metaData.masterReference.columnNames[i]] = masterRow[i] !== null ? masterRow[i].toString() : 'null';
                            //}
                        }
                        pageKey = JSON.stringify(pageKeyObj);
                        
                    }
                }
            }
            return pageKey;
        }
        
        /** Fills a datapage */
        const fillDataPage = (mapProv:Map<string, any>, request?:FetchRequest, mapScreen?:Map<string, IDataBook>) => {
            mapProv.set(getPageKey(), newDataSet);
            mapProv.set("current", newDataSet);

            if (mapScreen) {
                if (mapScreen.has(dataProvider)) {
                    (mapScreen.get(dataProvider) as IDataBook).data = mapProv;
                }
                else {
                    this.setDataBook(screenName, dataProvider, {data: mapProv})
                }
            }
        }

        if (clear) {
            this.clearDataFromProvider(screenName, dataProvider, true);
        }

        // Check if there is already a map of databooks for this screen, if not create one and fill the data
        const existingMap = this.getScreenDataproviderMap(screenName);
        if (existingMap) {
            // Check if there already is a databook object, if not create one
            const existingProvider = this.getDataBook(screenName, dataProvider);
            if (existingProvider && existingProvider.data) {
                let existingData;
                // If there is no filter in the request, edit the current of the databook, else edit the datapage
                if (!request?.filter) {
                    existingData = existingProvider.data.get("current");
                    //existingProvider.data.set(getPageKey(), existingData);
                }
                else {
                    existingData = existingProvider.data.get(getPageKey());
                }

                // If there is data, update existing data or overwrite existing data
                if (existingData) {
                    if (existingData.length <= from) {
                        existingData.push(...newDataSet);
                    } 
                    else {
                        let newDataSetIndex = 0;
                        for(let i = from; i <= to; i++) {
                            if (newDataSet.length === 1 && newDataSet[newDataSetIndex] && newDataSet[newDataSetIndex].recordStatus === "I" && existingData[i].recordStatus !== "I") {
                                this.insertDataProviderData(screenName, dataProvider)
                            }
                            existingData[i] = newDataSet[newDataSetIndex];
                            newDataSetIndex++;
                        }
                    }
                }
                else {
                    // If there is no data check for filter. No filter -> set current and create a datapage with the pagekey
                    if (!request?.filter) {
                        existingProvider.data.set("current", newDataSet);
                        existingData = existingProvider.data.get("current");
                        existingProvider.data.set(getPageKey(), existingData);
                    }
                    else {
                        // There is a filter, just create the pageKey
                        existingProvider.data.set(getPageKey(), newDataSet);
                        existingData = existingProvider.data.get(getPageKey());
                    }
                }

                // If all fetched and there is no new data, delete all data, if there is new data delete from to + 1
                if (isAllFetched && existingData) {
                    if (!newDataSet.length) {
                        (existingData as any[]).splice(0);
                    }
                    else {
                        (existingData as any[]).splice(to + 1);
                    }
                }

                // If there is no filter edit the datapage
                if (!request?.filter) {
                    // If all is fetched, or there is no datapage data, set the enitre new dataset
                    if (isAllFetched || !existingProvider.data.has(getPageKey()) || existingProvider.data.get(getPageKey()) === undefined) {
                        existingProvider.data.set(getPageKey(), existingData);
                    }
                    else {
                        // add new data or update data
                        const pageData = existingProvider.data.get(getPageKey());
                        if (pageData.length <= from) {
                            pageData.push(...newDataSet);
                        }
                        else {
                            for (let i = from; i <= to; i++) {
                                pageData[i] = existingData[i];
                            }
                        }
                        
                        existingProvider.data.set(getPageKey(), pageData);
                    }
                }
            } 
            else {
                if (compPanel && this.isPopup(compPanel) && this.getDataBook(dataProvider.split('/')[1], dataProvider)?.data) {
                    fillDataPage((this.getDataBook(dataProvider.split('/')[1], dataProvider) as IDataBook).data as Map<string, any>, request, existingMap);
                }
                else {
                    const providerMap = new Map<string, Array<any>>();
                    fillDataPage(providerMap, request, existingMap);
                }
            }
        }
        else {
            const dataMap = new Map<string, IDataBook>();
            if (compPanel && this.isPopup(compPanel) && this.getDataBook(dataProvider.split('/')[1], dataProvider)?.data) {
                fillDataPage((this.getDataBook(dataProvider.split('/')[1], dataProvider) as IDataBook).data as Map<string, any>, request, dataMap);
            }
            else {
                const providerMap = new Map<string, Array<any>>();
                fillDataPage(providerMap, request, dataMap);
            }
            this.dataBooks.set(screenName, dataMap);
        }

        if (request?.rootKey) {
            const dataBook = this.getDataBook(screenName, dataProvider);
            if (dataBook) {
                dataBook.rootKey = getPageKey();
            } 
        }

        // Notifying popups and components
        this.subManager.notifyDataChange(screenName, dataProvider);
        this.subManager.notifyScreenDataChange(screenName);
        this.subManager.notifyTreeDataChanged(dataProvider, this.dataBooks.get(screenName)?.get(dataProvider)?.data?.get(getPageKey()), getPageKey());
        
        if (compPanel && this.isPopup(compPanel) && this.getScreenDataproviderMap(dataProvider.split('/')[1])) {
            this.subManager.notifyDataChange(dataProvider.split('/')[1], dataProvider);
            this.subManager.notifyScreenDataChange(dataProvider.split('/')[1]);
        }
    }

    /**
     * Adds a LinkedCellEditor as referenced celleditors to it's referencedDatabook
     * @param screenName - the name of the screen
     * @param cellEditor - the cellEditor data
     * @param columnName - the name of the column
     * @param dataProvider - the name of the dataprovider
     */
    createReferencedCellEditors(screenName: string, cellEditor: ICellEditorLinked, columnName: string, dataProvider: string) {
        const existingMapModified = this.getScreenDataproviderMap(screenName);
        const linkReference = cellEditor.linkReference;
        // Checks if there already are databooks registered for the screen, if not it creates it and adds the celleditor
        if (existingMapModified) {
            // Check if the referencedDatabook is already available in the map if not create it and add the celleditor
            if (existingMapModified.has(linkReference.referencedDataBook)) {
                const dataBook = existingMapModified.get(linkReference.referencedDataBook) as IDataBook;
                // add the celleditors
                if (!dataBook.referencedCellEditors) {
                    dataBook.referencedCellEditors = [{ cellEditor: cellEditor, columnName: columnName, dataBook: dataProvider }];
                }
                else if (!dataBook.referencedCellEditors.some(ref => ref.columnName === columnName && ref.dataBook === dataProvider && _.isEqual(ref.cellEditor, cellEditor))) {
                    dataBook.referencedCellEditors.push({ cellEditor: cellEditor, columnName: columnName, dataBook: dataProvider });
                }
            }
            else {
                this.setDataBook(screenName, linkReference.referencedDataBook, { referencedCellEditors: [{ cellEditor: cellEditor, columnName: columnName, dataBook: dataProvider }] })
            }
        }
        else {
            this.setDataBook(screenName, linkReference.referencedDataBook, { referencedCellEditors: [{ cellEditor: cellEditor, columnName: columnName, dataBook: dataProvider }] })
        }

        // If there is no columnName in the linkReference and there are referencedColumnNames, add the cell-editor bound columnName to the linkReference columnNames
        if (!linkReference.columnNames.length && linkReference.referencedColumnNames.length) {
            linkReference.columnNames.push(columnName)
        }

        // Build the dataToDisplayMap
        if (existingMapModified?.has(linkReference.referencedDataBook) && existingMapModified.get(linkReference.referencedDataBook)?.data?.get("current")) {
            this.server.buildDataToDisplayMap(screenName, { cellEditor: cellEditor, columnName: columnName, dataBook: dataProvider }, existingMapModified.get(linkReference.referencedDataBook)?.data?.get("current"), existingMapModified.get(linkReference.referencedDataBook) as IDataBook, dataProvider);
        }
    }

    /**
     * Sets or updates the meta the metadata of a databook and notfies the metadata-subscribers.
     * @param screenName - the name of the screen
     * @param metaData - the metadata to set
     */
    setMetaData(screenName: string, metaData: MetaDataResponse) {
        const compPanel = this.getComponentByName(screenName) as IPanel;
        
        // If there are linkedcelleditors in the metadata, create referencedCellEditors to build the dataToDisplayMap
        const modifiedMetaData = {...metaData, columns: metaData.columns.map((column => {
            if (column.cellEditor.className === CELLEDITOR_CLASSNAMES.LINKED) {
                this.createReferencedCellEditors(screenName, column.cellEditor as ICellEditorLinked, column.name, metaData.dataProvider);
            }
            
            return column
        }))}

        // Look for existing databook if yes update/create metadata, or create the databook
        const existingMap = this.getScreenDataproviderMap(screenName);
        if (existingMap) {
            if (existingMap.has(metaData.dataProvider)) {
                (existingMap.get(metaData.dataProvider) as IDataBook).metaData = modifiedMetaData;
            }
            else {
                this.setDataBook(screenName, metaData.dataProvider, {metaData: modifiedMetaData})
            }
        }
        else {
            this.setDataBook(screenName, metaData.dataProvider, {metaData: modifiedMetaData})
        }

        // Notify that the metadata changed
        this.subManager.notifyMetaDataChange(screenName, metaData.dataProvider);
        if (compPanel && this.isPopup(compPanel) && this.getScreenDataproviderMap(metaData.dataProvider.split('/')[1])) {
            this.subManager.notifyMetaDataChange(metaData.dataProvider.split('/')[1], metaData.dataProvider);
        }
    }

    /**
     * Updates the metadata of a dataprovider, currently used during dataproviderchanged
     * @param screenName - the name of the screen
     * @param dataProvider - the name of the dataprovider
     * @param insertEnabled - true, if insert is enabled on the dataprovider
     * @param updateEnabled - true, if update is enabled on the dataprovider
     * @param deleteEnabled - true, if delete is enabled on the dataprovider
     * @param mInsertEnabled - true, if insert is enabled on the model of the dataprovider
     * @param mUpdateEnabled - true, if update is enabled on the model of the dataprovider
     * @param mDeleteEnabled - true, if delete is enabled on the model of the dataprovider
     * @param readOnly - true, if the dataprovider is set to readOnly
     * @param changedColumns - contains information about changed columns of the dataprovider
     */
    updateMetaData(screenName: string, 
        dataProvider: string, 
        insertEnabled?: boolean, 
        updateEnabled?: boolean, 
        deleteEnabled?: boolean,
        mInsertEnabled?: boolean, 
        mUpdateEnabled?: boolean, 
        mDeleteEnabled?: boolean,
        readOnly?: boolean, 
        changedColumns?:IChangedColumns[]
    ) {
        const compPanel = this.getComponentByName(screenName) as IPanel;
        const metaData = getMetaData(screenName, dataProvider, this, undefined);
        let changed = false;

        if (metaData) {
            if (insertEnabled !== undefined && metaData.insertEnabled !== insertEnabled) {
                metaData.insertEnabled = insertEnabled;
                changed = true;
            }

            if (updateEnabled !== undefined && metaData.updateEnabled !== updateEnabled) {
                metaData.updateEnabled = updateEnabled;
                changed = true;
            }

            if (deleteEnabled !== undefined && metaData.deleteEnabled !== deleteEnabled) {
                metaData.deleteEnabled = deleteEnabled;
                changed = true;
            }

            if (mInsertEnabled !== undefined && metaData.model_insertEnabled !== mInsertEnabled) {
                metaData.model_insertEnabled = mInsertEnabled;
                changed = true;
            }

            if (mUpdateEnabled !== undefined && metaData.model_updateEnabled !== mUpdateEnabled) {
                metaData.model_updateEnabled = mUpdateEnabled;
                changed = true;
            }

            if (mDeleteEnabled !== undefined && metaData.model_deleteEnabled !== mDeleteEnabled) {
                metaData.model_deleteEnabled = mDeleteEnabled;
                changed = true;
            }

            if (readOnly !== undefined && metaData.readOnly !== readOnly) {
                metaData.readOnly = readOnly;
                changed = true;
            }

            if (changedColumns) {
                changedColumns.forEach(changedColumn => {
                    const currentCol = metaData.columns.find(col => col.name === changedColumn.name);
                    if (currentCol) {
                        if (changedColumn.label !== undefined) {
                            currentCol.label = changedColumn.label;
                            changed = true;
                        }

                        if (changedColumn.readOnly !== undefined) {
                            currentCol.readOnly = changedColumn.readOnly;
                            changed = true;
                        }

                        if (changedColumn.movable !== undefined) {
                            currentCol.movable = changedColumn.movable;
                            changed = true;
                        }

                        if (changedColumn.sortable !== undefined) {
                            currentCol.sortable = changedColumn.sortable;
                            changed = true;
                        }

                        if (changedColumn.width !== undefined) {
                            currentCol.width = changedColumn.width;
                            changed = true;
                        }

                        if (changedColumn.cellEditor !== undefined) {
                            currentCol.cellEditor = changedColumn.cellEditor;
                            // If there are linkedcelleditors in the metadata, create referencedCellEditors to build the dataToDisplayMap
                            if (currentCol.cellEditor.className === CELLEDITOR_CLASSNAMES.LINKED) {
                                const castedCol = currentCol.cellEditor as ICellEditorLinked
                                const refDataBook = this.getDataBook(screenName, castedCol.linkReference.referencedDataBook);
                                if (refDataBook && refDataBook.referencedCellEditors && refDataBook.referencedCellEditors.length) {
                                    refDataBook.referencedCellEditors.splice(refDataBook.referencedCellEditors.findIndex(refCell =>  refCell.columnName === currentCol.name && refCell.dataBook === metaData.dataProvider), 1)
                                }
                                this.createReferencedCellEditors(screenName, castedCol, currentCol.name, metaData.dataProvider);
                            }      
                            changed = true;
                        }
                    }
                    else {
                        metaData.columns.push(changedColumn as LengthBasedColumnDescription);
                        changed = true;
                    }
                })
            }
        }

        // Notify if the metadata has been changed
        if (changed) {
            this.subManager.notifyMetaDataChange(screenName, dataProvider);
            if (compPanel && this.isPopup(compPanel) && this.getScreenDataproviderMap(dataProvider.split('/')[1])) {
                this.subManager.notifyMetaDataChange(dataProvider.split('/')[1], dataProvider);
            }
        }
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
        if(dataRow) {
            return dataRow;
        }
        else {
            return undefined
        }
            
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
                const dataBook = existingMap.get(dataProvider) as IDataBook;
                let newSelectedRow:ISelectedRow = {dataRow: dataRow, index: index, treePath: treePath ? treePath : dataBook.selectedRow?.treePath, selectedColumn: selectedColumn ? selectedColumn : dataBook.selectedRow?.selectedColumn};
                dataBook.selectedRow = newSelectedRow;
            }
            else {
                // If the compPanel is a popup use the screenName shown in the dataProvider
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
            // create the databook
            // If the compPanel is a popup use the screenName shown in the dataProvider
            let sr:IDataBook;
            if (compPanel && this.isPopup(compPanel) && this.getDataBook(dataProvider.split('/')[1], dataProvider)?.selectedRow) {
                sr = {selectedRow: this.getDataBook(dataProvider.split('/')[1], dataProvider)!.selectedRow };
                sr.selectedRow = {dataRow: dataRow, index: index, treePath: treePath, selectedColumn: selectedColumn}
            }
            else {
                sr = {selectedRow: {dataRow: dataRow, index: index, treePath: treePath, selectedColumn: selectedColumn}}
            }
            this.setDataBook(screenName, dataProvider, sr)
        }

        // Notify that the selectedRow changed
        this.subManager.emitRowSelect(screenName, dataProvider);
        this.subManager.notifyTreeSelectionChanged(dataProvider, this.dataBooks.get(screenName)?.get(dataProvider)?.selectedRow)
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
            // Notify selectedRow changed
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
     * @param all - true, if all data should be deleted
     */
    clearDataFromProvider(screenName:string, dataProvider: string, all?:boolean) {
        const dataBook = this.getDataBook(screenName, dataProvider);
        if (dataBook) {
            if (all) {
                dataBook.data = new Map<string, any>();
            }
            else {
                const data = dataBook.data;
                if (data) {  
                    data.delete("current");
                }
            }
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
     * Returns true, if the given component is a child of the given parent
     * @param component - the component to check
     * @param parent - the parent to check
     * @returns 
     */
    componentIsChildOf(component: IBaseComponent, parent: string) {
        let childComp: IBaseComponent|undefined = component;
        while (childComp) {
            if (this.componentChildren.has(parent)) {
                const children = this.componentChildren.get(parent);
                if (children && children.has(childComp.id)) {
                    return true;
                }
            }
            const newComp = this.getComponentById(childComp.parent)
            if (newComp) {
                childComp = newComp;
            }
            else {
                childComp = undefined;
            }
        }
        return false;
    }

    /** Returns the last id (numeric wise) which has been sent by the server */
    getLastID() {
        const allContent = Array.from(new Map([...this.flatContent, ...this.replacedContent, ...this.desktopContent, ...this.removedContent]).keys());
        let valueToReturn = 0;

        allContent.forEach(key => {
            const matchedKey = key.match(/^[^\d]*(\d+)/);
            if (matchedKey?.length === 2) {
                const val = parseInt(matchedKey[1])
                if (val > valueToReturn) {
                    valueToReturn = val;
                }
            }
        })
        return valueToReturn;
    }
}