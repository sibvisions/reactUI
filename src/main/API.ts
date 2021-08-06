/** Other imports */
import Server from "./Server";
import ContentStore from "./ContentStore";
import { createCloseScreenRequest, createOpenScreenRequest, createSetScreenParameterRequest } from "./factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "./request";
import { BaseMenuButton, ServerMenuButtons } from "./response";
import AppSettings from "./AppSettings";
import { CustomScreenType, CustomStartupProps, CustomToolbarItem, EditableMenuItem, ScreenWrapperOptions } from "./customTypes";
import { History } from "history";
import React, { ReactElement } from "react";
import BaseComponent from "./components/BaseComponent";
import { SubscriptionManager } from "./SubscriptionManager";

/** Contains the API functions */
class API {
    /**
     * @constructor constructs api instance
     * @param server - server instance
     */
    constructor (server: Server, store:ContentStore, appSettings:AppSettings, sub:SubscriptionManager, history?:History<any>) {
        this.#server = server;
        this.#contentStore = store;
        this.#appSettings = appSettings;
        this.history = history;
        this.#subManager = sub;
    }

    /** Server instance */
    #server: Server;
    /** Contentstore instance */
    #contentStore: ContentStore
    /** AppSettings instance */
    #appSettings: AppSettings
    /** the react routers history object */
    history?: History<any>;
    /** Subscription-Manager instance */
    #subManager: SubscriptionManager

    /**
     * Sends screen-parameters for the given screen to the server.
     * @param screenName - the screen-name
     * @param parameter - the screen-parameters
     */
    sendScreenParameter(screenName: string, parameter: { [key: string]: any }) {
        const parameterReq = createSetScreenParameterRequest();
        parameterReq.componentId = screenName;
        parameterReq.parameter = parameter;
        this.#server.sendRequest(parameterReq, REQUEST_ENDPOINTS.SET_SCREEN_PARAMETER);
    }

    /**
     * Sends a closeScreenRequest to the server for the given screen.
     * @param screenName - the screen to be closed
     */
    sendCloseScreen(screenName: string) {
        const csRequest = createCloseScreenRequest();
        csRequest.componentId = screenName;
        if (this.#contentStore.closeScreenParameters.has(screenName)) {
            csRequest.parameter = this.#contentStore.closeScreenParameters.get(screenName);
        }
        //TODO topbar
        this.#server.sendRequest(csRequest, REQUEST_ENDPOINTS.CLOSE_SCREEN);
        this.#contentStore.closeScreen(screenName);
    }

    addCustomScreen(id:string, screen:ReactElement) {
        this.#contentStore.customScreens.set(id, () => screen);
    }

    addReplaceScreen(id:string, screen:ReactElement) {
        this.#contentStore.replaceScreens.set(id, (x:any) => React.cloneElement(screen, x));
    }

    addScreenWrapper(screenName:string|string[], wrapper:ReactElement, pOptions?:ScreenWrapperOptions) {
        if (Array.isArray(screenName)) {
            screenName.forEach(name => this.#contentStore.screenWrappers.set(name, {wrapper: wrapper, options: pOptions ? pOptions : { global: true }}));
        }
        else {
            this.#contentStore.screenWrappers.set(screenName, {wrapper: wrapper, options: pOptions ? pOptions : { global: true }});
        }
    }

    addMenuItem(menuItem: CustomScreenType) {
        const menuGroup = this.#contentStore.menuItems.get(menuItem.menuGroup);
        const itemAction = () => {
            this.#contentStore.setActiveScreen(menuItem.id);
            this.history?.push("/home/" + menuItem.id);
            return Promise.resolve(true);
        };
        const newItem: ServerMenuButtons = {
            componentId: menuItem.id,
            text: menuItem.text,
            group: menuItem.menuGroup,
            image: menuItem.icon ? menuItem.icon.substring(0, 2) + " " + menuItem.icon : "",
            action: itemAction
        };
        if (menuGroup) {
            menuGroup.push(newItem);
        }
        else {
            this.#contentStore.menuItems.set(menuItem.menuGroup, [newItem]);
        }
    }

    editMenuItem(editItem: EditableMenuItem) {
        let itemToEdit: ServerMenuButtons | undefined;
        let itemFound: boolean = false
        this.#contentStore.menuItems.forEach(menuGroup => {
            itemToEdit = menuGroup.find(menuItem => menuItem.componentId.split(':')[0] === editItem.id);
            if (itemToEdit) {
                itemFound = true;
                if (editItem.newTitle) {
                    itemToEdit.text = editItem.newTitle;
                }
                if (editItem.newIcon) {
                    itemToEdit.image = editItem.newIcon.substring(0, 2) + " " + editItem.newIcon;
                }
            }
        });
        if (!itemFound) {
            this.#server.showToast({ severity: "error", summary: "Error while editing the menu-item. Could not find id: " + editItem.id + "!" }, true);
            console.error("Error while editing the menu-item. Could not find id: " + editItem.id + "!");
        }
    }

    removeMenuItem(id:string) {
        let itemToRemoveIndex:number = -1;
        let itemFound: boolean = false
        this.#contentStore.menuItems.forEach(menuGroup => {
            itemToRemoveIndex = menuGroup.findIndex(menuItem => menuItem.componentId.split(':')[0] === id);
            if (itemToRemoveIndex !== -1) {
                itemFound = true;
                menuGroup.splice(itemToRemoveIndex, 1);
            }
        });
        if (!itemFound) {
            this.#server.showToast({ severity: "error", summary: "Error removing the menu-item. Could not find id: " + id + "!" }, true);
            console.error("Error removing the menu-item. Could not find id: " + id + "!");
        }
    }

    addToolbarItem(toolbarItem: CustomToolbarItem) {
        const itemAction = () => {
            if (this.#contentStore.customScreens.has(toolbarItem.id)) {
                this.#contentStore.setActiveScreen(toolbarItem.id);
                this.history?.push("/home/" + toolbarItem.id);
                return Promise.resolve(true);
            }
            else {
                const openReq = createOpenScreenRequest();
                openReq.componentId = toolbarItem.id;
                return this.#server.sendRequest(openReq, REQUEST_ENDPOINTS.OPEN_SCREEN);
            }
        }
        this.#contentStore.addToolbarItem({ 
            componentId: toolbarItem.id, 
            text: toolbarItem.title, 
            image: toolbarItem.icon.substring(0, 2) + " " + toolbarItem.icon, 
            action: itemAction 
        });
    }

    editToolbarItem(editItem:EditableMenuItem) {
        let itemToEdit = this.#contentStore.toolbarItems.find(item => item.componentId.split(':')[0] === editItem.id);
        if (itemToEdit) {
            if (editItem.newTitle) {
                itemToEdit.text = editItem.newTitle;
            }
            if (editItem.newIcon) {
                itemToEdit.image = editItem.newIcon.substring(0, 2) + " " + editItem.newIcon;
            }
        }
        else {
            this.#server.showToast({ severity: "error", summary: "Error while editing the toolbar-item. Could not find id: " + editItem.id + "!" }, true);
            console.error("Error while editing the toolbar-item. Could not find id: " + editItem.id + "!");
        }
    }

    removeToolbarItem(id:string) {
        let itemToRemoveIndex:number = this.#contentStore.toolbarItems.findIndex(item => item.componentId.split(':')[0] === id);
        if (itemToRemoveIndex !== -1) {
            this.#contentStore.toolbarItems.splice(itemToRemoveIndex, 1);
        }
        else {
            this.#server.showToast({ severity: "error", summary: "Error while removing the toolbar-item. Could not find id: " + id + "!" }, true);
            console.error("Error while removing the toolbar-item. Could not find id: " + id + "!");
        }
    }

    addStartupProperties(startupProps:CustomStartupProps[]) {
        this.#contentStore.setStartupProperties(startupProps);
    }

    sendOpenScreenParameters(id:string, parameter: { [key:string]: any }) {
        if (!this.#contentStore.sentOpenScreenParameters.includes(id)) {
            const parameterReq = createSetScreenParameterRequest();
            parameterReq.componentId = id;
            parameterReq.parameter = parameter;
            this.#server.sendRequest(parameterReq, REQUEST_ENDPOINTS.SET_SCREEN_PARAMETER);
            this.#contentStore.sentOpenScreenParameters.push(id);
        }
    }

    addCustomComponent(name:string, customComp:ReactElement) {
        if (this.#contentStore.getComponentByName(name)) {
            this.#contentStore.customComponents.set(name, () => customComp);
            const comp = this.#contentStore.getComponentByName(name) as BaseComponent;
            const notifyList = new Array<string>();
            if (comp.parent) {
                notifyList.push(comp.parent);
            }
            notifyList.filter(this.#contentStore.onlyUniqueFilter).forEach(parentId => this.#subManager.parentSubscriber.get(parentId)?.apply(undefined, []));
        }
        else {
            this.#server.showToast({ severity: "error", summary: "Error while adding custom-component. Could not find name: " + name + "!" }, true);
            console.error("Error while adding custom-component. Could not find name: " + name + "!");
        }
        
    }
}
export default API