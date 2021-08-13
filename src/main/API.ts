/** Other imports */
import Server from "./Server";
import ContentStore from "./ContentStore";
import { createCloseScreenRequest, createOpenScreenRequest, createSetScreenParameterRequest } from "./factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "./request";
import { ServerMenuButtons } from "./response";
import AppSettings from "./AppSettings";
import { CustomMenuItem, CustomStartupProps, CustomToolbarItem, EditableMenuItem, ScreenWrapperOptions } from "./customTypes";
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
     * Sends an open-screen-request to the server to open a workscreen
     * @param id - the id of the screen opened
     * @param parameter - optional parameters that are being sent to the server
     * @param useClassName - true, if the screen is opened with the classname instead of the component id
     */
    sendOpenScreenRequest(id:string, parameter?: { [key: string]: any }, useClassName?:boolean) {
        const openReq = createOpenScreenRequest();
        if (useClassName) {
            openReq.className = id;
        }
        else {
            openReq.componentId = id;
        }
        if (parameter) {
            openReq.parameter = parameter;
        }
        return this.#server.sendRequest(openReq, REQUEST_ENDPOINTS.OPEN_SCREEN);
    }

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
    sendCloseScreen(id: string, parameter?: { [key: string]: any }, useClassName?:boolean) {
        const csRequest = createCloseScreenRequest();
        if (useClassName) {
            csRequest.className = id;
        }
        else {
            csRequest.componentId = id;
        }
        if (parameter) {
            csRequest.parameter = parameter;
        }
        //TODO topbar
        this.#server.sendRequest(csRequest, REQUEST_ENDPOINTS.CLOSE_SCREEN).then(res => {
            if (res[0] === undefined || res[0].name !== "message.error") {
                this.#contentStore.closeScreen(id)
                this.history?.push("/home")
            }
        });
    }

    /**
     * Adds a custom-screen to the application.
     * @param id - the id/name of the custom-screen
     * @param screen - the custom-screen to be added
     */
    addCustomScreen(id:string, screen:ReactElement) {
        this.#contentStore.customScreens.set(id, () => screen);
    }

    /**
     * Replaces a current screen sent by the server, based on the given id, with a custom-screen.
     * @param id - the id of the screen which will be replaced
     * @param screen - the custom-screen which will replace the screen
     */
    addReplaceScreen(id:string, screen:ReactElement) {
        this.#contentStore.replaceScreens.set(id, (x:any) => React.cloneElement(screen, x));
    }

    /**
     * Adds a screen-wrapper to a workscreen.
     * @param id - the id of the screen which will receive a screen-wrapper
     * @param wrapper - the screen-wrapper which will be added
     * @param pOptions - options of the screen-wrapper currently global:boolean
     */
    addScreenWrapper(id:string, wrapper:ReactElement, pOptions?:ScreenWrapperOptions) {
        this.#contentStore.screenWrappers.set(id, {wrapper: wrapper, options: pOptions ? pOptions : { global: true }});
    }

    /**
     * Adds a menu-item to your application.
     * @param menuItem - the menu-item to be added
     */
    addMenuItem(menuItem: CustomMenuItem) {
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

    /**
     * Edits an existing menu-item the server sends.
     * @param editItem - the EditableMenuItem object which holds the new menu-item info
     */
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

    /**
     * Removes a menu-item, which the server sends, from your application
     * @param id - the id of the menu-item which should be removed
     */
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

    /**
     * Adds an item to the toolbar
     * @param toolbarItem - the toolbar-item to be added
     */
    addToolbarItem(toolbarItem: CustomToolbarItem) {
        const itemAction = () => {
            if (this.#contentStore.customScreens.has(toolbarItem.id)) {
                this.#contentStore.setActiveScreen(toolbarItem.id);
                this.history?.push("/home/" + toolbarItem.id);
                return Promise.resolve(true);
            }
            else {
                return this.sendOpenScreenRequest(toolbarItem.id, undefined, true);
            }
        }
        this.#contentStore.addToolbarItem({ 
            componentId: toolbarItem.id, 
            text: toolbarItem.title, 
            image: toolbarItem.icon.substring(0, 2) + " " + toolbarItem.icon, 
            action: itemAction 
        });
    }

    /**
     * Edits an existing toolbar-item the server sends.
     * @param editItem - the EditableMenuItem object which holds the new toolbar-item info
     */
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

    /**
     * Removes a toolbar-item, which the server sends, from the toolbar
     * @param id 
     */
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

    /**
     * Adds properties which will be sent on startup
     * @param startupProps - the startup-properties to be sent
     */
    addStartupProperties(startupProps:CustomStartupProps[]) {
        this.#contentStore.setStartupProperties(startupProps);
    }

    /**
     * Replaces an existing component of a screen with a custom-component
     * @param name - the name of the component, which should be replaced
     * @param customComp - the custom-component
     */
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

    /**
     * Removes a component from a screen based on the given name
     * @param name - the name of the component which should be removed
     */
    removeComponent(name:string) {
        if (this.#contentStore.getComponentByName(name)) {
            this.#contentStore.removedCustomComponents.push(name);
            const comp = this.#contentStore.getComponentByName(name) as BaseComponent;
            const notifyList = new Array<string>();
            if (comp.parent) {
                notifyList.push(comp.parent);
            }
            notifyList.filter(this.#contentStore.onlyUniqueFilter).forEach(parentId => this.#subManager.parentSubscriber.get(parentId)?.apply(undefined, []));
        }
        else {
            this.#server.showToast({ severity: "error", summary: "Error while removing component. Could not find name: " + name + "!" }, true);
            console.error("Error while removing component. Could not find name: " + name + "!");
        }
    }

    /**
     * Returns the data of the current user.
     */
    getUser() {
        return this.#contentStore.currentUser;
    }
}
export default API