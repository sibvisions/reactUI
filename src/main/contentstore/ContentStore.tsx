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
import { SubscriptionManager } from "../SubscriptionManager";
import IBaseComponent from "../util/types/IBaseComponent";
import UserData from "../model/UserData";
import { IToolBarPanel } from "../components/panels/toolbarPanel/UIToolBarPanel";
import COMPONENT_CLASSNAMES from "../components/COMPONENT_CLASSNAMES";
import BaseContentStore, { ActiveScreen } from "./BaseContentStore";
import { BaseMenuButton, ServerMenuButtons } from "../response/data/MenuResponse";
import { ScreenWrapperOptions } from "../util/types/custom-types/ScreenWrapperType";
import AppSettings from "../AppSettings";
import { getNavigationIncrement } from "../util/other-util/GetNavigationIncrement";
import Server from "../server/Server";
import { IPanel } from "../components/panels/panel/UIPanel";
import { createFetchRequest } from "../factories/RequestFactory";
import REQUEST_KEYWORDS from "../request/REQUEST_KEYWORDS";
import { ICustomDefaultLogin, ICustomMFAText, ICustomMFAUrl, ICustomMFAWait, ICustomResetLogin } from "../../application-frame/login/Login";
import { Designer } from "../../MiddleMan";

/** The ContentStore stores active content like user, components and data. This ContentStore is for transferType: partial*/
export default class ContentStore extends BaseContentStore {
    /** SubscriptionManager instance */
    subManager: SubscriptionManager = new SubscriptionManager(this);

    /** AppSettings instance */
    appSettings: AppSettings = new AppSettings(this, this.subManager);

    /** Server instance */
    server: Server = new Server(this, this.subManager, this.appSettings, this.history);

    designer: Designer|null = null;

    /** A Map which stores the menugroup as key and an array of the menu-item objects usable by PrimeReact as values */
    menuItems = new Map<string, Array<ServerMenuButtons>>();

    /** The toolbar-entries sent by the server */
    toolbarItems = Array<BaseMenuButton>();

    /** The current logged in user */
    currentUser: UserData = new UserData();

    /** A cache for the dialog-buttons to know which component-id to send to the server */
    dialogButtons:Array<string> = new Array<string>();

    /** An object which either contains functions to render login-views or undefined if there are no custom login-views set */
    customLoginView: {
        default: ((props: ICustomDefaultLogin) => ReactElement) | undefined,
        reset: ((props: ICustomResetLogin) => ReactElement) | undefined,
        mfaText: ((props: ICustomMFAText) => ReactElement) | undefined,
        mfaWait: ((props: ICustomMFAWait) => ReactElement) | undefined,
        mfaUrl: ((props: ICustomMFAUrl) => ReactElement) | undefined
    }
        = {
            default: undefined,
            reset: undefined,
            mfaText: undefined,
            mfaWait: undefined,
            mfaUrl: undefined,
        };

    /**
     * Sets the currently active screens or clears the array
     * @param screenInfo - the screen-info of the newly opened screen or nothing to clear active screens
     * @param popup - true, if the newly opened screen is a popup
     */
    setActiveScreen(screenInfo?:ActiveScreen, popup?:boolean) {
        if (screenInfo) {
            if (popup) {
                const popupScreen:ActiveScreen = {...screenInfo};
                popupScreen.popup = true 
                this.activeScreens.push(popupScreen);
            }
            else {
                // push active screen in the screenhistory if it isn't a popup
                if (screenInfo.className) {
                    this.screenHistory.push({ className: screenInfo.className, componentId: screenInfo.name });
                }
                
                if (this.activeScreens[0] && this.activeScreens[0].popup) {
                    this.activeScreens.unshift(screenInfo);
                }
                else {
                    if (this.activeScreens.length && !this.inactiveScreens.includes(this.activeScreens[0].name)) {
                        this.inactiveScreens.push(this.activeScreens[0].name);
                    }
                    this.activeScreens = [screenInfo];
                }
            }
        }
        else {
            this.activeScreens = [];
        }
        this.subManager.emitActiveScreens();
    }

    //Content

    /**
     * Updates a components properties when the server sends new properties
     * @param existingComp - the existing component already in contentstore
     * @param newComp - the new component of changedcomponents
     */
    updateExistingComponent(existingComp:IBaseComponent|undefined, newComp:IBaseComponent, notifyList: string[]) {
        if (existingComp) {
            for (let newPropName in newComp) {
                // @ts-ignore  
                let existingProp = existingComp[newPropName];
                // @ts-ignore  
                let newProp = newComp[newPropName];
                if (["dataBook", "dataRow"].indexOf(newPropName) !== -1 && existingProp === newProp) {
                    if (existingProp && this.getDataBook(this.server.getScreenName(existingProp as string), existingProp)) {
                        this.dataBooks.get(this.server.getScreenName(existingProp as string))?.delete(existingProp)
                        const fetchReq = createFetchRequest();
                        fetchReq.dataProvider = existingProp;
                        fetchReq.includeMetaData = true;
                        this.server.missingDataFetches.push(existingProp)
                        this.server.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH)
                    }
                }

                if (newPropName === "parent" && existingComp[newPropName] !== newComp[newPropName]) {
                    this.addToNotifyList(existingComp, notifyList);
                }
                
                if (newPropName === "screen_title_") {
                    this.topbarTitle = newProp;
                    const foundActiveScreen = this.activeScreens.find(as => as.id === existingComp.id);
                    if (foundActiveScreen) {
                        foundActiveScreen.title = newProp;
                    }
                    this.subManager.emitActiveScreens();
                }

                // @ts-ignore
                existingComp[newPropName] = newComp[newPropName];

                if (this.designer && this.designer.selectedComponent?.component.id === existingComp.id) {
                    this.designer.updateSelectedComponentInnerComponent(existingComp);
                }

                if (existingComp.className === COMPONENT_CLASSNAMES.TOOLBARPANEL) {
                    this.updateToolBarProperties(existingComp as IToolBarPanel, newComp as IToolBarPanel, newPropName);
                }
                else if (existingComp.className === COMPONENT_CLASSNAMES.PANEL && this.isPopup(existingComp as IPanel)) {
                    this.updatePopupProperties(existingComp as IPanel, newComp as IPanel, newPropName)
                }
            }
        }
    }

    /**
     * Sets or updates flatContent, removedContent, replacedContent, updates properties and notifies subscriber
     * that either a popup should be displayed, properties changed, or their parent changed, based on server sent components
     * @param componentsToUpdate - an array of components sent by the server
     */
    updateContent(componentsToUpdate: Array<IBaseComponent>, desktop:boolean) {
        /** An array of all parents which need to be notified */
        const notifyList = new Array<string>();
        const menuButtonNotifyList = new Array<string>();
        /** 
         * Is the existing component if a component in the server sent components already exists in flatContent, replacedContent or
         * removedContent. Undefined if it is a new component
         */
        let existingComponent: IBaseComponent | undefined;

        componentsToUpdate.forEach(newComponent => {
            /** Checks if the component is a custom component */
            const isCustom:boolean = this.customComponents.has(newComponent.name as string);
            existingComponent = this.getExistingComponent(newComponent.id);

            if (existingComponent) {
                this.removeAsChild(existingComponent);
            }
            
            this.updateExistingComponent(existingComponent, newComponent, notifyList);

            if (newComponent.className === COMPONENT_CLASSNAMES.TOOLBARPANEL && !isCustom) {
                this.handleToolBarComponent(existingComponent as IToolBarPanel, newComponent as IToolBarPanel);
            }

            if ((newComponent.className === COMPONENT_CLASSNAMES.PANEL && ((newComponent as IPanel).screen_modal_ || (newComponent as IPanel).content_modal_)) 
                || (existingComponent && existingComponent.className === COMPONENT_CLASSNAMES.PANEL && ((existingComponent as IPanel).screen_modal_ || (existingComponent as IPanel).content_modal_))) {
                this.handleModalPanel(existingComponent as IPanel, newComponent as IPanel);
            }
            
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

                const removeChildren = (id: string, className: string, isCustom?:boolean) => {
                    const children = this.getChildren(id, className);
                    children.forEach(child => {
                        removeChildren(child.id, child.className);
                        if (isCustom) {
                            this.replacedContent.delete(newComponent.id);
                            this.removedCustomComponents.set(child.id, child);
                        }
                        else {
                            this.flatContent.delete(child.id);
                            this.removedContent.set(child.id, child);
                        }
                        
                    });
                }

                if (newComponent["~remove"]) {
                    if (!isCustom) {
                        //removeChildren(newComponent.id, existingComponent.className);
                        if (desktop) {
                            this.desktopContent.delete(newComponent.id);
                            this.removedDesktopContent.set(newComponent.id, existingComponent);
                        }
                        else {
                            this.flatContent.delete(newComponent.id);
                            this.invalidateChildren(newComponent.id, existingComponent.className);
                            this.removedContent.set(newComponent.id, existingComponent);
                        }
                    }
                    else {
                        //removeChildren(newComponent.id, existingComponent.className, true);
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


                if (existingComponent.className === COMPONENT_CLASSNAMES.MENU_ITEM && existingComponent.parent) {
                    menuButtonNotifyList.push(existingComponent.parent); 
                }
            }

            /** Add parent of newComponent to notifyList */
            if (
                newComponent.parent || 
                newComponent["~remove"] || 
                newComponent["~destroy"] || 
                newComponent.visible !== undefined || 
                newComponent.constraints ||
                newComponent.indexOf
            ) {
                if (existingComponent) {
                    this.addToNotifyList(existingComponent, notifyList);
                }
                else if(newComponent.parent) {
                    this.addToNotifyList(newComponent, notifyList);
                }

                if (newComponent.parent || newComponent.visible) {
                    if (existingComponent) {
                        this.validateComponent(existingComponent)
                    }
                }
            }

            if (!newComponent["~destroy"]) {
                // IF check because opening content after closeContent could return IF as parent this would mess up the children structure
                if (newComponent.parent && !newComponent.parent.startsWith("IF")) {
                    this.addAsChild(newComponent)
                }
                else if (existingComponent) {
                    this.addAsChild(existingComponent);
                }
            }

            if (!existingComponent) {
                if (!isCustom) {
                    if (newComponent["~remove"] !== 'true' && newComponent["~remove"] !== true && newComponent["~destroy"] !== 'true' && newComponent["~destroy"] !== true) {
                        if (desktop) {
                            this.desktopContent.set(newComponent.id, newComponent);
                        }
                        else {
                            if (this.designer?.isVisible && newComponent.name.startsWith('new_') && newComponent.constraints === "West") {
                                newComponent.designerNew = true;
                            }

                            this.flatContent.set(newComponent.id, newComponent);
                        }
                    }

                    if (this.designer && this.designer.selectedComponent && this.designer.selectedComponent.component.name === newComponent.name) {
                        this.designer.selectedComponent.component = newComponent;
                        this.designer.setGlassPaneSelectedComponent(newComponent)
                    }
                }
                else {
                    // Add the basic properties to the custom component
                    const newComp:IBaseComponent = {
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
        });

        /** Call the update function of the parentSubscribers */
        notifyList.filter(this.onlyUniqueFilter).forEach(parentId => this.subManager.parentSubscriber.get(parentId)?.apply(undefined, []));
        menuButtonNotifyList.filter(this.onlyUniqueFilter).forEach(parentId => this.subManager.notifyMenuButtonItemsChange(parentId));

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
                else if (existingComponent.className === COMPONENT_CLASSNAMES.PANEL && this.isPopup(existingComponent as IPanel)) {
                    const existingPopup = this.flatContent.get(existingComponent.id + "-popup") || this.removedContent.get(existingComponent.id + "-popup");
                    if (existingPopup) {
                        const updatePopup = this.subManager.propertiesSubscriber.get(existingPopup.id);
                        if (updatePopup) {
                            updatePopup(existingPopup);
                        }
                    }
                }
                if (updateFunction) {
                    updateFunction(existingComponent);
                }
            }
        });
    }

    /** Resets the contentStore */
    reset(){
        super.reset()
        this.toolbarItems = [];
        this.menuItems.clear();
        this.toolbarItems = new Array<BaseMenuButton>();
        //this.currentUser = new UserData();
    }

    /**
     * Returns all visible children of a parent, if tabsetpanel also return invisible
     * @param id - the id of the component
     */
    getChildren(id: string, className?: string): Map<string, IBaseComponent> {
        let children = new Map<string, IBaseComponent>();
        let parentId = id;

        const childrenSet = this.componentChildren.get(parentId);

        if (childrenSet?.size) {
            childrenSet.forEach(child => {
                const childComponent = this.getComponentById(child);

                if (childComponent && !this.removedCustomComponents.has(childComponent.name)) {
                    if (parentId.includes("TP")) {
                        children.set(childComponent.id, childComponent);
                    }
                    else if (childComponent.visible !== false) {
                        children.set(childComponent.id, childComponent);
                    }
                }
            })
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
        }
        return children;
    }

    /**
     * Returns all children of a parent
     * @param id - the id of the component
     * @param className  the classname of the component
     */
    getAllChildren(id: string, className?: string): Map<string, IBaseComponent> {
        let children = new Map<string, IBaseComponent>();
        let parentId = id;

        const childrenSet = this.componentChildren.get(parentId);

        if (childrenSet?.size) {
            childrenSet.forEach(child => {
                const childComponent = this.getComponentById(child);

                if (childComponent && !this.removedCustomComponents.has(childComponent.name)) {
                    children.set(childComponent.id, childComponent);
                }
            })
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
        }
        return children;
    }



    /**
     * Adds a menuItem to the contentStore
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

        if (menuItem.navigationName) {
            this.setNavigationName(menuItem.navigationName + getNavigationIncrement(menuItem.navigationName, this.navigationNames), menuItem.componentId);
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
                this.history?.push("/screens/" + title);
                return Promise.resolve(true);
            },
            flat: false
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
            const customComp = this.getComponentByName(title) as IBaseComponent
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