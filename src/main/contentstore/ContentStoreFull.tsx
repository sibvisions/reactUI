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

import BaseContentStore, { ActiveScreen } from "./BaseContentStore";
import COMPONENT_CLASSNAMES from "../components/COMPONENT_CLASSNAMES";
import { IToolBarPanel } from "../components/panels/toolbarPanel/UIToolBarPanel";
import { SubscriptionManager } from "../SubscriptionManager";
import IBaseComponent from "../util/types/IBaseComponent";
import { IPanel } from "../components/panels/panel/UIPanel";
import { isWorkScreen } from "../util/component-util/IsWorkScreen";
import AppSettings from "../AppSettings";
import ServerFull from "../server/ServerFull";
import { createFetchRequest } from "../factories/RequestFactory";
import REQUEST_KEYWORDS from "../request/REQUEST_KEYWORDS";
import { Designer } from "@sibvisions/visionx/dist/moduleIndex";

/** The ContentStore stores active content like user, components and data. This ContentStore is for transferType: full*/
export default class ContentStoreFull extends BaseContentStore {
    /** SubscriptionManager instance */
    subManager: SubscriptionManager = new SubscriptionManager(this);

    /** AppSettings instance */
    appSettings: AppSettings = new AppSettings(this, this.subManager);

    /** Server instance */
    server: ServerFull = new ServerFull(this, this.subManager, this.appSettings, this.history);

    designer: Designer|null = null;

    /**
     * Sets the currently active screens or clears the array
     * @param screenInfo - the screen-info of the newly opened screen or nothing to clear active screens
     */
     setActiveScreen(screenInfo?:ActiveScreen) {
        if (screenInfo) {
            if (this.activeScreens.length && !this.inactiveScreens.includes(this.activeScreens[0].name)) {
                this.inactiveScreens.push(this.activeScreens[0].name);
            }
            this.activeScreens = [screenInfo];
        }
        else {
            this.activeScreens = [];
        }
        this.subManager.emitActiveScreens();
    }

    // Content

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
                    this.addToNotifyList(existingComp, notifyList)
                }

                // @ts-ignore
                existingComp[newPropName] = newComp[newPropName];

                if (this.designer && this.designer.selectedComponent?.component.id === existingComp.id) {
                    this.designer.updateSelectedComponentInnerComponent(existingComp);
                }

                if (newPropName === "parent" && existingComp.className === COMPONENT_CLASSNAMES.TOOLBAR && !(existingComp.parent?.includes("TBP") || newComp.parent?.includes("TBP"))) {
                    existingComp[newPropName] = newComp[newPropName] + "-frame-toolbar";
                }

                if (existingComp.className === COMPONENT_CLASSNAMES.TOOLBARPANEL) {
                    this.updateToolBarProperties(existingComp as IToolBarPanel, newComp as IToolBarPanel, newPropName);
                }
            }
        }
    }

    /**
     * Sets or updates flatContent, removedContent, replacedContent, updates properties and notifies subscriber
     * that either a popup should be displayed, properties changed, or their parent changed, based on server sent components
     * @param componentsToUpdate - an array of components sent by the server
     */
     updateContent(componentsToUpdate: Array<IBaseComponent>) {
        /** An array of all parents which need to be notified */
        const notifyList = new Array<string>();
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
            
            if (existingComponent) {
                if (newComponent["~remove"] !== true) {
                    /** If the new component is in removedContent, either add it to flatContent or replacedContent if it is custom or not*/
                    if (this.isRemovedComponent(newComponent.id)) {
                        if (!isCustom) {
                            this.removedContent.delete(newComponent.id);
                            this.flatContent.set(newComponent.id, existingComponent);
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
                        if (existingComponent && existingComponent.className === COMPONENT_CLASSNAMES.INTERNAL_FRAME) {
                            // Close screen when InternalFrame is a workscreen
                            if (isWorkScreen(existingComponent as IPanel)) {
                                this.closeScreen(existingComponent.id, existingComponent.name);
                            }
                            else {
                                // Close screen and delete InternalFrame when first child of InternalFrame is a workscreen or login
                                const foundChild = Array.from(this.flatContent.values()).find(comp => comp.parent === existingComponent!.id)
                                if (foundChild) {
                                    this.flatContent.delete(newComponent.id);
                                    this.invalidateChildren(newComponent.id, existingComponent.className);
                                    this.removedContent.set(newComponent.id, existingComponent);
                                    if (isWorkScreen(foundChild as IPanel)) {
                                        this.closeScreen(foundChild.id, foundChild.name);
                                    }
                                }
                            }
                        }
                        else {
                            //removeChildren(newComponent.id, existingComponent.className);
                            this.flatContent.delete(newComponent.id);
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
                    this.removedContent.delete(newComponent.id);
                    this.removedCustomComponents.delete(newComponent.id);
                }
            }

            if (!existingComponent) {
                if (!isCustom) {
                    if (newComponent["~remove"] !== 'true' && newComponent["~remove"] !== true && newComponent["~destroy"] !== 'true' && newComponent["~destroy"] !== true) {
                        if (newComponent.className === COMPONENT_CLASSNAMES.TOOLBAR && !newComponent.parent?.includes("TBP")) {
                            newComponent.parent = newComponent.parent + "-frame-toolbar";
                        }
                        this.flatContent.set(newComponent.id, newComponent);
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

                if (newComponent.parent) {
                    if (existingComponent) {
                        this.validateComponent(existingComponent);
                    }
                }
            }

            if (!newComponent["~destroy"]) {
                if (newComponent.parent) {
                    this.addAsChild(newComponent)
                }
                else if (existingComponent) {
                    this.addAsChild(existingComponent);
                }
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
        const mergedContent = [...this.flatContent, ...this.replacedContent];
        const foundMenu = mergedContent.find(v => v[1].parent === id && v[1].className === COMPONENT_CLASSNAMES.MENUBAR);
        if (foundMenu) {
            return foundMenu[1];
        }
        return undefined;
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
            else if (className === COMPONENT_CLASSNAMES.MOBILELAUNCHER || className === COMPONENT_CLASSNAMES.INTERNAL_FRAME) {
                children = new Map([...children].filter(entry => !entry[1]["~additional"]));
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
            else if (className === COMPONENT_CLASSNAMES.MOBILELAUNCHER || className === COMPONENT_CLASSNAMES.INTERNAL_FRAME) {
                children = new Map([...children].filter(entry => !entry[1]["~additional"]));
            }
        }
        return children;
    }

    /**
    * Returns the component id of a screen for a component
    * @param id - the id of the component
    * @returns the component id of a screen for a component
    */
    getScreenName(id: string, dataProvider?:string) {
        if (dataProvider) {
            return this.server.getScreenName(dataProvider);
        }
        else {
            let comp: IBaseComponent | undefined = this.flatContent.has(id) ? this.flatContent.get(id) : this.desktopContent.get(id);
            if (comp) {
                while (comp?.parent) {
                    if ((comp as IPanel).screen_modal_ || (comp as IPanel).screen_navigationName_) {
                        break;
                    }
                    else if ((comp as IPanel).content_className_) {
                        return dataProvider ? dataProvider.split("/")[1] : comp.name;
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
}