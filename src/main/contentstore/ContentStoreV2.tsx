import { IPanel } from "../../moduleIndex";
import BaseContentStore, { ActiveScreen } from "./BaseContentStore";
import COMPONENT_CLASSNAMES from "../components/COMPONENT_CLASSNAMES";
import { IToolBarPanel } from "../components/panels/toolbarPanel/UIToolBarPanel";
import { SubscriptionManager } from "../SubscriptionManager";
import { isWorkScreen } from "../util";
import BaseComponent from "../util/types/BaseComponent";

export default class ContentStoreV2 extends BaseContentStore {
    /** subscriptionManager instance */
    subManager: SubscriptionManager = new SubscriptionManager(this);

    /**
     * Sets the currently active screens or clears the array
     * @param screenInfo - the screen-info of the newly opened screen or nothing to clear active screens
     */
     setActiveScreen(screenInfo?:ActiveScreen) {
        if (screenInfo) {
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
     updateExistingComponent(existingComp:BaseComponent|undefined, newComp:BaseComponent) {
        if (existingComp) {
            for (let newPropName in newComp) {
                // @ts-ignore
                existingComp[newPropName] = newComp[newPropName];

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
     updateContent(componentsToUpdate: Array<BaseComponent>) {
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

                if (newComponent["~remove"]) {
                    if (!isCustom) {
                        if (existingComponent && existingComponent.className === COMPONENT_CLASSNAMES.INTERNAL_FRAME) {
                            // Close screen when InternalFrame is a workscreen
                            if (isWorkScreen(existingComponent as IPanel)) {
                                this.closeScreen(existingComponent.name);
                            }
                            else {
                                // Close screen and delete InternalFrame when first child of InternalFrame is a workscreen or login
                                const foundWorkScreen = Array.from(this.flatContent.values()).find(comp => comp.parent === existingComponent!.id && 
                                    (isWorkScreen(comp as IPanel) || comp.classNameEventSourceRef === "Login"));
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
                    else {
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
                    if (newComponent.className === COMPONENT_CLASSNAMES.TOOLBAR && !newComponent.parent?.includes("TBP")) {
                        newComponent.parent = newComponent.parent + "-frame-toolbar";
                    }
                    this.flatContent.set(newComponent.id, newComponent);
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
     getChildren(id: string, className?: string): Map<string, BaseComponent> {
        const mergedContent = new Map([...this.flatContent, ...this.replacedContent]);
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
            else if (className === COMPONENT_CLASSNAMES.MOBILELAUNCHER || className === COMPONENT_CLASSNAMES.INTERNAL_FRAME) {
                children = new Map([...children].filter(entry => !entry[1]["~additional"]));
            }
        }
        return children;
    }
}