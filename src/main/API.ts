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

/** Other imports */
import Server from "./server/Server";
import ContentStore from "./contentstore/ContentStore";
import { createCloseScreenRequest, createOpenScreenRequest, createSetScreenParameterRequest, createInsertRecordRequest, createSelectRowRequest } from "./factories/RequestFactory";
import AppSettings from "./AppSettings";
import { History } from "history";
import React, { ReactElement } from "react";
import BaseComponent from "./util/types/BaseComponent";
import { SubscriptionManager } from "./SubscriptionManager";
import BaseServer from "./server/BaseServer";
import ServerFull from "./server/ServerFull";
import BaseContentStore from "./contentstore/BaseContentStore";
import ContentStoreFull from "./contentstore/ContentStoreFull";
import REQUEST_KEYWORDS from "./request/REQUEST_KEYWORDS";
import { ScreenWrapperOptions } from "./util/types/custom-types/ScreenWrapperType";
import CustomMenuItem from "./util/types/custom-types/CustomMenuItem";
import { ServerMenuButtons } from "./response/data/MenuResponse";
import EditableMenuItem from "./util/types/custom-types/EditableMenuItem";
import CustomToolbarItem from "./util/types/custom-types/CustomToolbarItem";
import CustomStartupProps from "./util/types/custom-types/CustomStartupProps";
import UserData from "./model/UserData";
import COMPONENT_CLASSNAMES from "./components/COMPONENT_CLASSNAMES";
import { ICustomDefaultLogin, ICustomMFAText, ICustomMFAUrl, ICustomMFAWait, ICustomResetLogin } from "../application-frame/login/Login";
import RESPONSE_NAMES from "./response/RESPONSE_NAMES";

export interface IAPI {
    sendRequest: (req: any, keyword: string) => void,
    sendOpenScreenRequest: (id:string, parameter?: { [key: string]: any }) => Promise<any>,
    sendScreenParameter: (screenName: string, parameter: { [key: string]: any }) => void,
    sendCloseScreenRequest: (screenName: string, parameter?: { [key: string]: any }, popup?:boolean) => void,
    insertRecord: (id:string, dataProvider:string) => void,
    deleteRecord: (id:string, dataProvider:string) => void,
    addCustomScreen: (id:string, screen:ReactElement) => void,
    addReplaceScreen: (id:string, screen:ReactElement) => void,
    addScreenWrapper: (id:string, wrapper:ReactElement, pOptions?:ScreenWrapperOptions) => void
    addMenuItem: (menuItem: CustomMenuItem) => void,
    editMenuItem: (editItem: EditableMenuItem) => void,
    removeMenuItem: (id:string) => void,
    addToolbarItem: (toolbarItem: CustomToolbarItem) => void,
    editToolbarItem: (editItem:EditableMenuItem) => void,
    removeToolbarItem: (id:string) => void,
    addStartupProperties: (startupProps:CustomStartupProps[]) => void,
    addCustomComponent: (name:string, customComp:ReactElement) => void,
    removeComponent: (name:string) => void
    getUser: () => UserData,
    addGlobalComponent: (name:string, comp:ReactElement) => void,
    addCSSToHeadBefore: (path:string) => void,
    addCSSToHeadAfter: (path:string) => void,
    extendComponent: (name: string, component: ReactElement) => void,
    addCustomLogin: (defaultView:(props: ICustomDefaultLogin) => ReactElement, resetView?: (props: ICustomResetLogin) => ReactElement, mfaTextView?: (props: ICustomMFAText) => ReactElement, mfaWaitView?: (props: ICustomMFAWait) => ReactElement, mfaUrlView?: (props: ICustomMFAUrl) => ReactElement) => void
    getApplicationParameter: (key:string) => any
}

/** Contains the API functions */
class API implements IAPI {
    /**
     * @constructor constructs api instance
     * @param server - server instance
     */
    constructor (server: BaseServer|Server|ServerFull, store:BaseContentStore|ContentStore|ContentStoreFull, appSettings:AppSettings, sub:SubscriptionManager, history?:History<any>) {
        this.#server = server;
        this.#contentStore = store;
        this.#appSettings = appSettings;
        this.history = history;
        this.#subManager = sub;
    }

    /** Server instance */
    #server: BaseServer|Server|ServerFull;
    /** Contentstore instance */
    #contentStore: BaseContentStore|ContentStore|ContentStoreFull
    /** AppSettings instance */
    #appSettings: AppSettings
    /** the react routers history object */
    history?: History<any>;
    /** Subscription-Manager instance */
    #subManager: SubscriptionManager

    /** Sets the ContentStore */
    setContentStore(store: BaseContentStore|ContentStore|ContentStoreFull) {
        this.#contentStore = store;
    }

    /** Sets the Server */
    setServer(server: BaseServer|Server|ServerFull) {
        this.#server = server;
    }

    /**
     * Sends a request to the server
     * @param req - the request you want to send to the server
     * @param keyword - the keyword to the endpoint to send the request to
     */
    sendRequest(req: any, keyword: string) {
        this.#server.sendRequest(req, keyword);
    }

    /**
     * Sends an open-screen-request to the server to open a workscreen
     * @param id - the id of the screen opened
     * @param parameter - optional parameters that are being sent to the server
     */
    sendOpenScreenRequest(id:string, parameter?: { [key: string]: any }) {
        const openReq = createOpenScreenRequest();
        openReq.className = id;
        if (parameter) {
            openReq.parameter = parameter;
        }
        return this.#server.sendRequest(openReq, REQUEST_KEYWORDS.OPEN_SCREEN);
    }

    /**
     * Sends an open-screen request internally
     * @param id - the id of the screen opened
     */
    sendOpenScreenIntern(id:string) {
        const openReq = createOpenScreenRequest();
        openReq.componentId = id;
        return this.#server.sendRequest(openReq, REQUEST_KEYWORDS.OPEN_SCREEN);
    }

    /**
     * Sends parameters to the server.
     * @param parameter - the screen-parameters
     */
     sendParameter(parameter: { [key: string]: any }) {
        const parameterReq = createSetScreenParameterRequest();
        parameterReq.parameter = parameter;
        this.#server.sendRequest(parameterReq, REQUEST_KEYWORDS.SET_PARAMETER);
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
        this.#server.sendRequest(parameterReq, REQUEST_KEYWORDS.SET_SCREEN_PARAMETER);
    }

    /**
     * Sends a closeScreenRequest to the server for the given screen.
     * @param screenName - the component id of the screen
     * @param parameter - the screen-parameters
     * @param popup - true, if the screen to close is a popup
     */
    sendCloseScreenRequest(screenName: string, parameter?: { [key: string]: any }, popup?:boolean) {
        if (this.#appSettings.transferType !== "full") {
            const csRequest = createCloseScreenRequest();
            csRequest.componentId = screenName;
            const screenId = this.#contentStore.getComponentByName(screenName)?.id as string
            if (parameter) {
                csRequest.parameter = parameter;
            }
            //TODO topbar
            this.#server.sendRequest(csRequest, REQUEST_KEYWORDS.CLOSE_SCREEN).then(res => {
                if (res[0] === undefined || res[0].name !== RESPONSE_NAMES.ERROR) {
                    if (popup) {
                        (this.#server as Server).lastClosedWasPopUp = true;
                    }
                    else {
                        (this.#server as Server).lastClosedWasPopUp = false;
                    }
                    this.#contentStore.closeScreen(screenId, screenName, false);
                    this.history?.push("/home")
                }
            });
        }

    }

    /**
     * Inserts a record into the given dataprovider
     * @param screenName - the id of the screen
     * @param dataProvider - the dataprovider which should be used
     */
    insertRecord(screenName:string, dataProvider:string) {
        this.#contentStore.insertDataProviderData(screenName, dataProvider);
        const insertReq = createInsertRecordRequest();
        insertReq.dataProvider = dataProvider;
        this.sendRequest(insertReq, REQUEST_KEYWORDS.INSERT_RECORD);
    }

    /**
     * Deletes the current selected record from the given dataprovider
     * @param screenName - the id of the screen
     * @param dataProvider - the dataprovider which should be used
     */
    deleteRecord(screenName:string, dataProvider:string) {
        this.#contentStore.deleteDataProviderData(screenName, dataProvider);
        const deleteReq = createSelectRowRequest();
        deleteReq.dataProvider = dataProvider;
        this.sendRequest(deleteReq, REQUEST_KEYWORDS.DELETE_RECORD);
    }

    /**
     * Adds a custom-screen to the application.
     * @param screenName - the id/name of the custom-screen
     * @param screen - the custom-screen to be added
     */
    addCustomScreen(screenName:string, screen:ReactElement) {
        this.#contentStore.customScreens.set(screenName, () => screen);
    }

    /**
     * Replaces a current screen sent by the server, based on the given screenName, with a custom-screen.
     * @param screenName - the id of the screen which will be replaced
     * @param screen - the custom-screen which will replace the screen
     */
    addReplaceScreen(screenName:string, screen:ReactElement) {
        this.#contentStore.replaceScreens.set(screenName, (x:any) => React.cloneElement(screen, x));
    }

    /**
     * Adds a screen-wrapper to a workscreen.
     * @param screenName - the id of the screen which will receive a screen-wrapper
     * @param wrapper - the screen-wrapper which will be added
     * @param pOptions - options of the screen-wrapper currently global:boolean
     */
    addScreenWrapper(screenName:string, wrapper:ReactElement, pOptions?:ScreenWrapperOptions) {
        this.#contentStore.screenWrappers.set(screenName, {wrapper: wrapper, options: pOptions ? pOptions : { global: true }});
    }

    /**
     * Adds a menu-item to your application.
     * @param menuItem - the menu-item to be added
     */
    addMenuItem(menuItem: CustomMenuItem) {
        if (this.#contentStore.customScreens.has(menuItem.id)) {
            const menuGroup = (this.#contentStore as ContentStore).menuItems.get(menuItem.menuGroup);
            const itemAction = () => {
                this.#contentStore.setActiveScreen({ name: menuItem.id, id: "", className: undefined, navigationName: menuItem.navigationName });
                this.history?.push("/screens/" + menuItem.id);
                return Promise.resolve(true);
            };
            const newItem: ServerMenuButtons = {
                componentId: menuItem.id,
                text: menuItem.text,
                group: menuItem.menuGroup,
                image: menuItem.icon ? menuItem.icon.substring(0, 2) + " " + menuItem.icon : "",
                action: itemAction,
                flat: false
            };
            if (menuGroup) {
                menuGroup.push(newItem);
            }
            else {
                (this.#contentStore as ContentStore).menuItems.set(menuItem.menuGroup, [newItem]);
            }
        }
        else {
            this.#subManager.emitToast({ message: "Error while adding the menu-item. Could not find id: " + menuItem.id + "! Maybe the Custom-Screen isn't registered yet.", name: "" }, "error");
            console.error("Error while adding the menu-item. Could not find id: " + menuItem.id + "! Maybe the Custom-Screen isn't registered yet.");
        }
    }

    /**
     * Edits an existing menu-item the server sends.
     * @param editItem - the EditableMenuItem object which holds the new menu-item info
     */
    editMenuItem(editItem: EditableMenuItem) {
        let itemToEdit: ServerMenuButtons | undefined;
        let itemFound: boolean = false;
        (this.#contentStore as ContentStore).menuItems.forEach(menuGroup => {
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
            this.#subManager.emitToast({ message: "Error while editing the menu-item. Could not find id: " + editItem.id + "!", name: "" }, "error");
            console.error("Error while editing the menu-item. Could not find id: " + editItem.id + "!");
        }
    }

    /**
     * Removes a menu-item, which the server sends, from your application
     * @param id - the id of the menu-item which should be removed
     */
    removeMenuItem(id:string) {
        let itemToRemoveIndex:number = -1;
        let itemFound: boolean = false;
        (this.#contentStore as ContentStore).menuItems.forEach(menuGroup => {
            itemToRemoveIndex = menuGroup.findIndex(menuItem => menuItem.componentId.split(':')[0] === id);
            if (itemToRemoveIndex !== -1) {
                itemFound = true;
                menuGroup.splice(itemToRemoveIndex, 1);
            }
        });
        if (!itemFound) {
            this.#subManager.emitToast({ message: "Error removing the menu-item. Could not find id: " + id + "!", name: "" }, "error");
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
                this.#contentStore.setActiveScreen({name: toolbarItem.id, id: "", className: undefined, navigationName: toolbarItem.navigationName });
                this.history?.push("/screens/" + toolbarItem.id);
                return Promise.resolve(true);
            }
            else {
                return this.sendOpenScreenRequest(toolbarItem.id);
            }
        }
        (this.#contentStore as ContentStore).addToolbarItem({ 
            componentId: toolbarItem.id, 
            text: toolbarItem.title, 
            image: toolbarItem.icon.substring(0, 2) + " " + toolbarItem.icon, 
            action: itemAction,
            flat: false
        });
    }

    /**
     * Edits an existing toolbar-item the server sends.
     * @param editItem - the EditableMenuItem object which holds the new toolbar-item info
     */
    editToolbarItem(editItem:EditableMenuItem) {
        let itemToEdit = (this.#contentStore as ContentStore).toolbarItems.find(item => item.componentId.split(':')[0] === editItem.id);
        if (itemToEdit) {
            if (editItem.newTitle) {
                itemToEdit.text = editItem.newTitle;
            }
            if (editItem.newIcon) {
                itemToEdit.image = editItem.newIcon.substring(0, 2) + " " + editItem.newIcon;
            }
        }
        else {
            this.#subManager.emitToast({ message: "Error while editing the toolbar-item. Could not find id: " + editItem.id + "!", name: "" }, "error");
            console.error("Error while editing the toolbar-item. Could not find id: " + editItem.id + "!");
        }
    }

    /**
     * Removes a toolbar-item, which the server sends, from the toolbar
     * @param id 
     */
    removeToolbarItem(id:string) {
        let itemToRemoveIndex:number = (this.#contentStore as ContentStore).toolbarItems.findIndex(item => item.componentId.split(':')[0] === id);
        if (itemToRemoveIndex !== -1) {
            (this.#contentStore as ContentStore).toolbarItems.splice(itemToRemoveIndex, 1);
        }
        else {
            this.#subManager.emitToast({ message: "Error while removing the toolbar-item. Could not find id: " + id + "!", name: "" }, "error");
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
        let component = this.#contentStore.getComponentByName(name);
        let tableFlag = component && component.className === COMPONENT_CLASSNAMES.TABLE && component.parent?.includes("TBP") && this.#contentStore.getComponentById(component.parent);
        
        if (component) {
            this.#contentStore.customComponents.set(tableFlag ? this.#contentStore.getComponentById(component.parent)!.name : name, () => customComp);
            const notifyList = new Array<string>();
            if (tableFlag) {
                const parent = this.#contentStore.getComponentById(component.parent)
                if (parent && parent.parent) {
                    notifyList.push(parent.parent);
                }
            }
            else {
                if (component.parent) {
                    notifyList.push(component.parent);
                }
            }
            notifyList.filter(this.#contentStore.onlyUniqueFilter).forEach(parentId => this.#subManager.parentSubscriber.get(parentId)?.apply(undefined, []));
        }
        else {
            this.#subManager.emitToast({ message: "Error while adding custom-component. Could not find name: " + name + "!", name: "" }, "error");
            console.error("Error while adding custom-component. Could not find name: " + name + "!");
        }
    }

    /**
     * Removes a component from a screen based on the given name
     * @param name - the name of the component which should be removed
     */
    removeComponent(name:string) {
        if (this.#contentStore.getComponentByName(name)) {
            const comp = this.#contentStore.getComponentByName(name) as BaseComponent;
            this.#contentStore.removedCustomComponents.set(name, comp);
            const notifyList = new Array<string>();
            if (comp.parent) {
                notifyList.push(comp.parent);
            }
            notifyList.filter(this.#contentStore.onlyUniqueFilter).forEach(parentId => this.#subManager.parentSubscriber.get(parentId)?.apply(undefined, []));
        }
        else {
            this.#subManager.emitToast({ message: "Error while removing component. Could not find name: " + name + "!", name: "" }, "error");
            console.error("Error while removing component. Could not find name: " + name + "!");
        }
    }

    /**
     * Returns the data of the current user.
     */
    getUser() {
        return (this.#contentStore as ContentStore).currentUser;
    }

    /**
     * Adds a global-component to the ContentStore
     * @param name - the name of the global-component
     * @param comp - the component to render
     */
    addGlobalComponent(name:string, comp:ReactElement) {
        this.#contentStore.addedComponents.set(name, (props:any) => React.cloneElement(comp, props));
    }

    /**
     * Adds a css file to the head before the dynamically loaded css files of the reactUI
     * @param path - the path to the css-file
     */
    addCSSToHeadBefore(path:string) {
        let before = undefined
        for (let link of document.head.getElementsByTagName('link')) {
            if (!before && link.href.includes("design")) {
                before = link;
            }
            else if (!before && link.href.includes("themes")) {
                before = link
            }
            else if (!before && link.href.includes("color-schemes")) {
                before = link;
            }
            else if (link.href.includes("application.css")) {
                before = link;
            }
        }
        const link:HTMLLinkElement = document.createElement('link');
        link.rel = 'stylesheet'; 
        link.type = 'text/css';
        link.href = path;
        
        if (before) {
            document.head.insertBefore(link, before);
        }
        else {
            document.head.appendChild(link);
        }
    }

    /**
     * Adds a css file to the head after the dynamically loaded css files of the reactUI
     * @param path - the path to the css-file
     */
    addCSSToHeadAfter(path:string) {
        const link:HTMLLinkElement = document.createElement('link');
        link.rel = 'stylesheet'; 
        link.type = 'text/css';
        link.href = path;
        if (this.#appSettings.appReady) {
            document.head.appendChild(link);
        }
        else {
            this.#appSettings.cssToAddWhenReady.push(link);
        }
    }

    /**
     * Extends a component with the given functions
     * @param name - the name of the component
     * @param component - the component with the functions to be extended
     */
    extendComponent(name: string, component: ReactElement) {
        const existingComp = this.#contentStore.getComponentByName(name);
        if (existingComp) {
            for (let newPropName in component.props) {
                //@ts-ignore
                existingComp[newPropName] = component.props[newPropName];
            }
            this.#subManager.propertiesSubscriber.get(existingComp.id)?.apply(undefined, [existingComp]);
        }
    }

    /**
     * Adds a custom-login-view to the application
     * @param customLogin - The custom-login-view as react-element
     * @param useDefault - true, if the "default" login-mask should be replaced
     * @param useReset - true, if the "reset" login-mask should be replaced
     * @param useTextMFA - true, if the "text-multi-factor-authenticator" should be replaced
     * @param useWaitMFA - true, if the "wait-multi-factor-authenticator" should be replaced
     * @param useURLMFA - true, if the "url-multi-factor-authenticator" should be replaced
     */
    addCustomLogin(defaultView:(props: ICustomDefaultLogin) => ReactElement, resetView?: (props: ICustomResetLogin) => ReactElement, mfaTextView?: (props: ICustomMFAText) => ReactElement, mfaWaitView?: (props: ICustomMFAWait) => ReactElement, mfaUrlView?: (props: ICustomMFAUrl) => ReactElement) {
        if (this.#appSettings.transferType !== "full") {
            const customLoginView = (this.#contentStore as ContentStore).customLoginView;
            customLoginView.default = defaultView;

            if (resetView !== undefined) {
                customLoginView.reset = resetView;
            }

            if (mfaTextView !== undefined) {
                customLoginView.mfaText = mfaTextView;
            }

            if (mfaWaitView !== undefined) {
                customLoginView.mfaWait = mfaWaitView;
            }

            if (mfaUrlView !== undefined) {
                customLoginView.mfaUrl = mfaUrlView;
            }
        }
    }

    /**
     * Returns the value for the given key out of the application-parameters
     * @param key - the key of which value should be returned
     */
    getApplicationParameter(key:string) {
        return this.#contentStore.customProperties.get(key);
    }
}
export default API