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

import AppSettings from "./AppSettings";
import BaseContentStore from "./contentstore/BaseContentStore";
import ContentStore from "./contentstore/ContentStore"
import ContentStoreFull from "./contentstore/ContentStoreFull";
import { DeviceStatus } from "./response/event/DeviceStatusResponse";
import { LoginModeType, MFAURLType } from "./response/login/LoginResponse";
import Server from "./server/Server";
import BaseServer from "./server/BaseServer";
import ServerFull from "./server/ServerFull";
import ErrorResponse from "./response/error/ErrorResponse";
import MessageResponse from "./response/ui/MessageResponse";
import DialogResponse from "./response/ui/DialogResponse";

/** Manages subscriptions and handles the subscriber events */
export class SubscriptionManager {
    /** Contentstore instance */
    contentStore: BaseContentStore|ContentStore|ContentStoreFull;

    /** AppSettings instance */
    appSettings: AppSettings;

    /** Server instance */
    server: BaseServer|Server|ServerFull;

    /** 
     * A Map which stores components which want to subscribe to their properties, 
     * the key is the screen name and the value is a function to update the state of the properties 
     */
    propertiesSubscriber = new Map<string, Function>();

    /**
     * A Map which stores a function to update the state of a parents childcomponents, components which use the 
     * useComponents hook subscribe to the parentSubscriber the key is the screen name and the 
     * value is a function to update the state of a parents childcomponents
     */
    parentSubscriber = new Map<string, Function>();

    /**
     * A Map which stores an Array of functions to update the state of a screens dataProviders, components which use
     * the useDataProviders hook subscribe to a screens dataProvider, the key is a screen screen name and the
     * value is an Array of functions to update the subscribers dataProviders state
     */
    dataProvidersSubscriber = new Map<string, Array<Function>>();

    /**
     * A Map which stores another Map of dataproviders of a screen, it subscribes the components which use the 
     * useRowSelect hook, subscribe to the changes of a screens dataproviders selectedRow, the key is the screens screen name and the
     * value is another Map which key is the dataprovider and the value is an array of functions to update the
     * subscribers selectedRow state
     */
    rowSelectionSubscriber = new Map<string, Map<string, Array<Function>>>();

    /**
     * A Map which stores a function to update a components state of all dataproviders selected-row, key is the screens screen name
     * and value is the function to update the state
     */
    screenRowSelectionSubscriber = new Map<string, Function>();

    /**
     * A Map which stores another Map of dataproviders of a screen, it subscribes the components which use the
     * useDataProviderData hook, subscribe to the changes of a screens dataproviders data, the key is the screens screen name and the
     * value is another Map which key is the dataprovider and the value is an array of functions to update the
     * subscribers data state
     */
    dataChangeSubscriber = new Map<string, Map<string, Array<Function>>>();

    /**
     * A Map which stores another Map of dataproviders of a screen, it subscribes the components which use the
     * useMetadata hook, subscribe to the changes of a screens dataproviders metadata, the key is the screens screen name and the
     * value is another Map which key is the dataprovider and the value is an array of functions to update the
     * subscribers metadata state
     */
    metaDataSubscriber = new Map<string, Map<string, Array<Function>>>();

    /**
     * A Map which stores a function to update a components state of all dataproviders data, key is the screens screen name
     * value is the function to update the state
     */
    screenDataChangeSubscriber = new Map<string, Function>();

    /**
     * A function to update the screenTitle of the menu
     */
    screenTitleSubscriber:Function = () => {};

    /**
     * A Map which stores a function to update the menu-collapsed state of the subscribers, the key is the name of the subscribers
     * and the value is the function to update the menu-collapsed state
     */
    menuCollapseSubscriber = new Map<string, Function>();

    /**
     * A Map which stores a function to update boolean flag state of the tree subscribers, key is the master databook and value is
     * an array of functions to update all tree flip state which have this master databook
     */
    treeSubscriber = new Map<string, Array<Function>>();

    linkedDisplayMapSubscriber = new Map<string, Map<string, Array<Function>>>();

    treeDataChangedSubscriber = new Map<string, Function>();

    /** An array of functions to update the menuitem states of its subscribers */
    menuSubscriber = new Array<Function>();

    /** A function to change the appReady state to true */
    appReadySubscriber:Function = () => {};

    /** A function to change the visible state of the error-bar */
    errorBarVisibleSubscriber:Function = () => {};

    /** A function to change the properties of the error-bar */
    errorBarPropertiesSubscriber:Function = () => {};

    /** A function to change the visible state of the change password dialog */
    changePasswordVisibleSubscriber:Function = () => {};

    /** A function to change the message-dialog properties */
    messageDialogPropsSubscriber:Function = () => {};

    /** A function to update the properties of the error-dialog */
    errorDialogPropsSubscriber:Function = () => {};

    /** A function to update which menubuttons should be visible */
    appSettingsSubscriber = new Array<Function>();

    /** An array of functions to change the deviceMode state */
    deviceModeSubscriber = new Array<Function>();

    /** A function to check if a login-request is currently active */
    loginActiveSubscriber:Function = () => {};

    /** Subscribes to session-expired */
    sessionExpiredSubscriber = new Array<Function>();
 
    /**
     * A Map which stores another Map of dataproviders of a screen, it subscribes the components which use the
     * useSortDefinitions hook, subscribe to the changes of a screens sort-definitions, the key is the screens screen name and the
     * value is another Map which key is the dataprovider and the value is an array of functions to update the
     * subscribers sort-definition state
     */
    sortDefinitionSubscriber = new Map<string, Map<string, Array<Function>>>();

    /** An array of functions to update the toolbar items */
    toolbarSubscriber = new Array<Function>();

    /** A function to update the toast-subscriber */
    toastSubscriber:Function = () => {};

    /** A function to update the close-frame-subscriber */
    closeFrameSubscriber:Function = () => {};

    /** An array of functions to update the active-screen subscriber */
    activeScreenSubscriber = new Map<string, Function>();

    /** An array of function to subscribe components to app restart */
    restartSubscriber = new Array<Function>();

    /** An array of functions to subscribes components to the tab-title */
    tabTitleSubscriber = new Array<Function>();

    /** A function that subscribes the AppWrapper to the css-version of application.css */
    appCssVersionSubscriber:Function = () => {};

    /** 
     * A Map which stores a function to update the theme state of the subscribers, the key is the name of the subscribers
     * and the value is the function to update the theme state
     */
    themeSubscriber = new Map<string, Function>();

    /** A function to update the Login-component to the login-mode */
    loginSubscriber:Function = () => {};

    /** A function to update the mfa-wait-component to its properties */
    mFAWaitSubscriber:Map<string, Function> = new Map<string, Function>();

    /** A function to update the mfa-url-component to its properties */
    mFAURLSubscriber:Map<string, Function> = new Map<string, Function>();

    appReadyParamsSubscriber: Function = () => {};

    menuButtonItemsSubscriber:Map<string, Function> = new Map<string, Function>();

    uploadDialogSubscriber: Function = () => {};

    /** 
     * A Map with functions to update the state of components, is used for when you want to wait for the responses to be handled and then
     * call the state updates to reduce the amount of state updates/rerenders
     */
    jobQueue:Map<string, any> = new Map();

    /**
     * @constructor constructs submanager instance
     * @param store - contentstore instance
     */
    constructor(store: BaseContentStore|ContentStore|ContentStoreFull) {
        this.contentStore = store;
        this.appSettings = new AppSettings(store, this);
        this.server = new Server(store as ContentStore, this, this.appSettings);
    }

    /** Sets the ContentStore */
    setContentStore(store: BaseContentStore|ContentStore|ContentStoreFull) {
        this.contentStore = store;
    }

    /** Sets the AppSettings */
    setAppSettings(appSettings:AppSettings) {
        this.appSettings = appSettings;
    }

    /** Sets the Server */
    setServer(server:Server|ServerFull) {
        this.server = server;
    }

    /**
     * Adds a subscriber for a screen and dataprovider to the subscription-map
     * @param screenName - the name of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the state
     * @param subs - the subscription-map to add the function to
     */
    handleScreenDataProviderSubscriptions(screenName:string, dataProvider:string, fn:Function, subs:Map<string, Map<string, Array<Function>>>) {
        /** Checks if there is already a Map for the dataChangeSubscriber */
        const existingMap = subs.get(screenName);
        if (existingMap) {
            /** Checks if there already is a function array of other components, if yes add the new function if not add the dataprovider with an array */
            const subscriber = existingMap.get(dataProvider);
            if(subscriber) {
                subscriber.push(fn);
            }
            else {
                existingMap.set(dataProvider, new Array<Function>(fn));
            }
        }
        else {
            const tempMap:Map<string, Array<Function>> = new Map();
            tempMap.set(dataProvider, new Array<Function>(fn));
            subs.set(screenName, tempMap);
        }
    }

    /**
     * Handles the unsubscribing process of components which are subscribed to data-providers
     * @param screenName - the name of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the state
     * @param subs - the subscription-map which should be unsubscribed from
     */
    handleScreenDataProviderUnsubs(screenName:string, dataProvider:string, fn:Function, subs:Map<string, Map<string, Array<Function>>>) {
        const subscriber = subs.get(screenName)?.get(dataProvider)
        if(subscriber)
            subscriber.splice(subscriber.findIndex(subFunction => subFunction === fn),1);
    }

    /**
     * Subscribes the component which uses the useProperties hook, with the id to property changes
     * @param id - the screen name
     * @param fn - the function to update the component's properties state
     */
    subscribeToPropChange(id: string, fn: Function){
        this.propertiesSubscriber.set(id, fn);
    }

    /**
     * Subscribes parents which use the useComponents hook, to change their childcomponent state
     * @param id - the screen name
     * @param fn - the function to update a parents childcomponent state
     */
    subscribeToParentChange(id: string, fn: Function){
        this.parentSubscriber.set(id, fn);
    }

    /**
     * Subscribes components which use the useDataProviders hook, to change their dataProviders state
     * @param screenName - the name of the screen
     * @param fn - the function to update the dataProviders state
     */
    subscribeToDataProviders(screenName:string, fn:Function) {
        /** Check if there is already a function array for this screen */
        const subscriber = this.dataProvidersSubscriber.get(screenName);
        if (subscriber)
            subscriber.push(fn)
        else
            this.dataProvidersSubscriber.set(screenName, new Array<Function>(fn));
    }

    /**
     * Subscribes components which use the useRowSelect hook, to change their selectedRow state
     * @param screenName - the name of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the selectedRow state
     */
    subscribeToRowSelection(screenName:string, dataProvider: string, fn: Function) {
        this.handleScreenDataProviderSubscriptions(screenName, dataProvider, fn, this.rowSelectionSubscriber);
    }

    /**
     * Subscribes components which use the useDataProviderData hook, to change their data state
     * @param screenName - the name of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the data state
     */
    subscribeToDataChange(screenName:string, dataProvider: string, fn: Function) {
        this.handleScreenDataProviderSubscriptions(screenName, dataProvider, fn, this.dataChangeSubscriber);
    }

    /**
     * Subscribes components which use the useMetadata hook, to change their metadata state
     * @param screenName - the name of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the data state
     */
    subscribeToMetaData(screenName:string, dataProvider:string, fn: Function) {
        this.handleScreenDataProviderSubscriptions(screenName, dataProvider, fn, this.metaDataSubscriber);
    }

    /**
     * Subscribes components which to datadisplaymap, to update their map
     * @param screenName - the name of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the data state
     */
    subscribeToLinkedDisplayMap(screenName:string, dataProvider:string, fn: Function) {
        this.handleScreenDataProviderSubscriptions(screenName, dataProvider, fn, this.linkedDisplayMapSubscriber);
    }

    /**
     * Subscribes a component to its screen-data (every dataprovider data)
     * @param screenName - the name of the screen
     * @param fn - the function to update the state
     */
    subscribeToScreenDataChange(screenName:string, fn:Function) {
        this.screenDataChangeSubscriber.set(screenName, fn)
    }

    /**
     * Subscribes a component to its dataproviders selected-rows
     * @param screenName - the screen name of the screen
     * @param fn - the function to update the state
     */
    subscribeToScreenRowChange(screenName:string, fn:Function) {
        this.screenRowSelectionSubscriber.set(screenName, fn);
    }

    /**
     * Subscribes components to the screen-name, to change their screen-name state
     * @param fn - the function to update the screen-name state
     */
    subscribeToScreenTitle(fn: Function) {
        this.screenTitleSubscriber = fn;
    }

    /**
     * Subscribes the menu to menuChanges , to change the menu-item state
     * @param fn - the function to update the menu-item state
     */
    subscribeToMenuChange(fn: Function){
        this.menuSubscriber.push(fn);
    }

    /**
     * Subscribes components to menuChanges (menu-collapsed), to change their menu-collapsed state
     * @param id - the screen name
     * @param fn - the function to update the menu-collapsed state
     */
    subscribeToMenuCollapse(id:string, fn: Function) {
        this.menuCollapseSubscriber.set(id, fn);
    }

    /**
     * Subscribes components to flip flag, to change their flag state
     * @param masterDataBook  - the master databook of the tree
     * @param fn  - the function to update the flip flag
     */
    subscribeToTreeChange(masterDataBook:string, fn:Function) {
        const subscriber = this.treeSubscriber.get(masterDataBook);
        if (subscriber)
            subscriber.push(fn)
        else
            this.treeSubscriber.set(masterDataBook, new Array<Function>(fn));
    }

    subscribeToTreeDataChange(databookString:string, fn:Function) {
        this.treeDataChangedSubscriber.set(databookString, fn);
    }

    /**
     * Subscribes the app to app-ready, to change the app-ready state
     * @param fn  - the function to change the app-ready state
     */
    subscribeToAppReady(fn:Function) {
        this.appReadySubscriber = fn;
    }

    /**
     * Subscribes components to sort-definition, to change their sort-definition state
     * @param screenName - the screen name of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the state
     */
    subscribeToSortDefinitions(screenName:string, dataProvider:string, fn:Function) {
        this.handleScreenDataProviderSubscriptions(screenName, dataProvider, fn, this.sortDefinitionSubscriber);
    }

    /**
     * Subscribes the error-bar component, to change its visible state
     * @param fn - the function to update the state
     */
    subscribeToErrorBarVisible(fn:Function) {
        this.errorBarVisibleSubscriber = fn
    }

    /**
     * Subscribes the error-bar component, to change its property state
     * @param fn - the function to update the state
     */
    subscribeToErrorBarProps(fn:Function) {
        this.errorBarPropertiesSubscriber = fn;
    }

    /**
     * Subscribes the change-password dialog, to change its visible state
     * @param fn - the function to update the state
     */
    subscribeToChangePasswordVisible(fn:Function) {
        this.changePasswordVisibleSubscriber = fn;
    }

    /**
     * Subscribes the message-dialog hook, to change its property state
     * @param fn 
     */
    subscribeToMessageDialogProps(fn:Function) {
        this.messageDialogPropsSubscriber = fn;
    }

    /**
     * Subscribes the error-dialog component, to change its property state
     * @param fn 
     */
    subscribeToErrorDialogProps(fn:Function) {
        this.errorDialogPropsSubscriber = fn;
    }

    /**
     * Subscribes the menu to app-settings, to change the app-settings state, to show the menu-buttons or not
     * @param fn - the function to change the app-settings state
     */
    subscribeToAppSettings(fn: Function) {
        this.appSettingsSubscriber.push(fn)
    }

    /**
     * Subscribes to deviceMode, to change the device-mode state
     * @param fn - the function to change the device-mode state
     */
    subscribeToDeviceMode(fn: Function) {
        this.deviceModeSubscriber.push(fn)
    }

    /**
     * Subscribes to the toolbar-items, to have the newest toolbar-items
     * @param fn - the function to update the toolbar-items
     */
    subscribeToToolBarItems(fn: Function) {
        this.toolbarSubscriber.push(fn);
    }

    /**
     * Subscribes the UIToast to message-responses, to change the dialog-response state, to show the
     * UIToast
     * @param fn - the function to change the dialog-response state
     */
     subscribeToToast(fn:Function) {
        this.toastSubscriber = fn;
    }

    /**
     * Subscribes the UIToast to close-frame-responses, to change the close-frame state, to close toasts
     * @param fn - the function to change the clsoe-frame state
     */
     subscribeToCloseFrame(fn:Function) {
        this.closeFrameSubscriber = fn;
    }

    /**
     * Subscribes to the active-screens, to have the active-screens
     * @param key - key of which component gets added to the subscription
     * @param fn - the function to update the toolbar-items
     */
     subscribeToActiveScreens(key:string, fn: Function) {
        this.activeScreenSubscriber.set(key, fn);
    }

    /**
     * Subscribes to restart
     * @param fn - the function to update the state
     */
    subscribeToRestart(fn:Function) {
        this.restartSubscriber.push(fn);
    }

    /**
     * Subscribes to tab-title
     * @param fn - the function to update the state
     */
    subscribeToTabTitle(fn: Function) {
        this.tabTitleSubscriber.push(fn);
    }

    /**
     * Subscribes to application css-version
     * @param fn - the function to update the state
     */
    subscribeToAppCssVersion(fn:Function) {
        this.appCssVersionSubscriber = fn;
    }

    /**
     * Subscribes to theme
     * @param fn - the function to update the state
     */
    subscribeToTheme(id:string, fn:Function) {
        this.themeSubscriber.set(id, fn);
    }

    /**
     * Subscribes to login-mode
     * @param fn - the function to update the state
     */
    subscribeToLogin(fn:Function) {
        this.loginSubscriber = fn;
    }

    /**
     * Subscribes to mfa-wait-properties
     * @param fn - the function to update the state
     */
    subscribeToMFAWait(name: string, fn:Function) {
        this.mFAWaitSubscriber.set(name, fn);
    }

    /**
     * Subscribes to mfa-url-properties
     * @param fn - the function to update the state
     */
    subscribeToMFAURL(name: string, fn:Function) {
        this.mFAURLSubscriber.set(name, fn);
    }

    subscribeToAppReadyParams(fn: Function) {
        this.appReadyParamsSubscriber = fn;
    }

    /**
     * Subscribes to active-login check
     * @param fn  - the function to update the state
     */
    subscribeToLoginActive(fn:Function) {
        this.loginActiveSubscriber = fn;
    }

    /**
     * Subscribes to session-expired status
     * @param fn  - the function to update the state
     */
    subscribeToSessionExpired(fn:Function) {
        this.sessionExpiredSubscriber.push(fn);
    }

    subscribeToMenuButtonItems(key: string, fn: Function) {
        this.menuButtonItemsSubscriber.set(key, fn);
    }

    subscribeToUploadDialog(fn: Function) {
        this.uploadDialogSubscriber = fn;
    }

    /**
     * Unsubscribes the menu from menuChanges
     * @param fn - the function to update the menu-item state
     */
    unsubscribeFromMenuChange(fn: Function){
        this.menuSubscriber.splice(this.menuSubscriber.findIndex(subFunction => subFunction === fn), 1);
    }

    /**
    * Unsubscribes components from dataProviders
    * @param screenName - the screen name of the screen
    * @param fn - the function to update the dataProvider state
    */
    unsubscribeFromDataProviders(screenName:string, fn: Function) {
        const subscriber = this.dataProvidersSubscriber.get(screenName);
        if (subscriber)
            subscriber.splice(subscriber.findIndex(subFunction => subFunction === fn), 1)
    }

    /**
     * Unsubscibes components from dataChange
     * @param screenName - the screen name of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the data state
     */
    unsubscribeFromDataChange(screenName:string, dataProvider: string, fn: Function) {
        this.handleScreenDataProviderUnsubs(screenName, dataProvider, fn, this.dataChangeSubscriber);
    }

    /**
     * Unsubscibes components from dataChange
     * @param screenName - the screen name of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the data state
     */
     unsubscribeFromMetaData(screenName:string, dataProvider: string, fn: Function) {
        this.handleScreenDataProviderUnsubs(screenName, dataProvider, fn, this.metaDataSubscriber);
    }

    /**
     * Unsubscibes components from dataChange
     * @param screenName - the screen name of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the data state
     */
    unsubscribeFromLinkedDisplayMap(screenName:string, dataProvider: string, fn: Function) {
        this.handleScreenDataProviderUnsubs(screenName, dataProvider, fn, this.linkedDisplayMapSubscriber);
    }

    /**
     * Unsubscribes a component from its screen-data (every dataprovider data)
     * @param screenName - the screen name of the screen
     */
    unsubscribeFromScreenDataChange(screenName:string) {
        this.screenDataChangeSubscriber.delete(screenName);
    }

    /**
     * Unsubscribes a component from its dataproviders selected-rows
     * @param screenName 
     */
    unsubscribeFromScreenRowChange(screenName:string) {
        this.screenRowSelectionSubscriber.delete(screenName);
    }

    /**
     * Unsubscribes a component from rowSelection
     * @param screenName - the screen name of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the selectedRow state
     */
    unsubscribeFromRowSelection(screenName:string, dataProvider: string, fn: Function){
        this.handleScreenDataProviderUnsubs(screenName, dataProvider, fn, this.rowSelectionSubscriber);
    }

    /**
     * Unsubscribes a component from parentChanges
     * @param id - the screen name
     */
    unsubscribeFromParentChange(id: string){
        this.parentSubscriber.delete(id);
    }

    /**
     * Unsubscribes a component from property changes
     * @param id - the screen name
     */
    unsubscribeFromPropChange(id: string){
        this.propertiesSubscriber.delete(id);
    }

    /**
     * Unsubscribes a component from screen-name changes
     * @param id - the screen name
     */
    unsubscribeFromScreenTitle() {
        this.screenTitleSubscriber = () => {}
    }

    /**
     * Unsubscribes a component from menu-collapse
     * @param id - the screen name
     */
    unsubscribeFromMenuCollapse(id:string) {
        this.menuCollapseSubscriber.delete(id);
    }

    /**
     * Unsubscribes a tree from its flip flag
     * @param masterDataBook - the master dataBook of the tree
     */
    unsubscribeFromTreeChange(masterDataBook:string, fn:Function) {
        const subscriber = this.treeSubscriber.get(masterDataBook)
        if (subscriber)
            subscriber.splice(subscriber.findIndex(subFunction => subFunction === fn),1);
    }

    unsubscribeFromTreeDataChange(dataBookString:string) {
        this.treeDataChangedSubscriber.delete(dataBookString)
    }

    /**
     * Unsubscribes app from app-ready
     */
    unsubscribeFromAppReady() {
        this.appReadySubscriber = () => {};
    }

    /**
     * Unsubscribe error-bar from visible
     */
    unsubscribeFromErrorBarProps() {
        this.errorBarPropertiesSubscriber = () => {};
    }

    /**
     * Unsubscribe error-bar from visible
     */
    unsubscribeFromErrorBarVisible() {
        this.errorBarVisibleSubscriber = () => {};
    }

    /**
     * Unsubscribe change-password dialog from visible
     */
     unsubscribeFromChangePasswordVisible() {
        this.changePasswordVisibleSubscriber = () => {};
    }

    /**
     * Unsubscribe change-password dialog from visible
     */
     unsubscribeFromMessageDialogProps() {
        this.messageDialogPropsSubscriber = () => {};
    }

    unsubscribeFromErrorDialogProps() {
        this.errorDialogPropsSubscriber = () => {};
    }

    /**
     * Unsubscribes from app-settings
     */
     unsubscribeFromAppSettings(fn:Function) {
        this.appSettingsSubscriber.splice(this.appSettingsSubscriber.findIndex(subFunction => subFunction === fn), 1);
    }

    /**
     * Unsubscribes from device-mode
     */
     unsubscribeFromDeviceMode(fn:Function) {
        this.deviceModeSubscriber.splice(this.deviceModeSubscriber.findIndex(subFunction => subFunction === fn), 1);
    }

    /**
     * Unsubscribes a component from sort-definition
     * @param screenName - the screen name of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update sort-definition
     */
    unsubscribeFromSortDefinitions(screenName:string, dataProvider:string, fn: Function) {
        this.handleScreenDataProviderUnsubs(screenName, dataProvider, fn, this.sortDefinitionSubscriber);
    }
    
    /**
     * Unsubscribes a component from toolbar-items
     * @param fn - the function to update the toolbar-items
     */
    unsubscribeFromToolBarItems(fn:Function) {
        this.deviceModeSubscriber.splice(this.deviceModeSubscriber.findIndex(subFunction => subFunction === fn), 1);
    }

    /** Unsubscribes UIToast from message-responses */
    unsubscribeFromToast() {
        this.toastSubscriber = () => {};
    }

    /** Unsubscribes UIToast from close-frame-responses */
    unsubscribeFromCloseFrame() {
        this.closeFrameSubscriber = () => {};
    }

    /**
     * Unsubscribes from active-screens
     */
     unsubscribeFromActiveScreens(key:string) {
        this.activeScreenSubscriber.delete(key);
    }

    /**
     * Unsubscribes from restart
     * @param fn - the function to update the state
     */
    unsubscribeFromRestart(fn:Function) {
        this.restartSubscriber.splice(this.restartSubscriber.findIndex(subFunction => subFunction === fn), 1);
    }

    /**
     * Unsubscribes from tab-title
     * @param fn - the function to update the state
     */
    unsubscribeFromTabTitle(fn:Function) {
        this.tabTitleSubscriber.splice(this.tabTitleSubscriber.findIndex(subFunction => subFunction === fn), 1);
    }

    /**
     * Unsubscribes from app css-version
     */
    unsubscribeFromAppCssVersion() {
        this.appCssVersionSubscriber = () => {};
    }

    /**
     * Unsubscribes from theme
     * @param id - the id to delete
     */
    unsubscribeFromTheme(id:string) {
        this.themeSubscriber.delete(id);
    }

    /**
     * Unsubscribes from login-mode
     */
    unsubscribeFromLogin() {
        this.loginSubscriber = () => {};
    }

    /**
     * Unsubscribes from mfa-wait-properties
     */
    unsubscribeFromMFAWait(name: string) {
        this.mFAWaitSubscriber.delete(name);
    }

    /**
     * Unsubscribes from mfa-url-properties
     */
    unsubscribeFromMFAURL(name: string) {
        this.mFAURLSubscriber.delete(name);
    }

    /**
     * Unsubscribes from app-ready parameters
     */
    unsubscribeFromAppParamsSubscriber() {
        this.appReadyParamsSubscriber = () => {};
    }

    /**
     * Unsubscribes from login active check
     */
    unsubscribeFromActiveLogin() {
        this.loginActiveSubscriber = () => {};
    }

    unsubscribeFromMenuButtonItems(key:string) {
        this.menuButtonItemsSubscriber.delete(key)
    }

    /**
     * Unsubscribes from session-expired status
     */
    unsubscribeFromSessionExpired(fn:Function) {
        this.sessionExpiredSubscriber.splice(this.sessionExpiredSubscriber.findIndex(subFunction => subFunction === fn), 1)
    }

    /**
     * Unsubscribe from upload dialog
     */
    unsubscribeFromUploadDialog() {
        this.uploadDialogSubscriber = () => {};
    }

    /**
     * Notifies the components which use the useDataProviders hook that their dataProviders changed
     * @param screenName 
     */
    notifyDataProviderChange(screenName:string) {
        this.dataProvidersSubscriber.get(screenName)?.forEach(subFunction => subFunction.apply(undefined, []));
    }

    /**
     * Notifies the components which use the useDataProviderData hook that their data changed
     * @param screenName - the screen name of the screen
     * @param dataProvider - the dataprovider
     */
    notifyDataChange(screenName:string, dataProvider: string) {
        this.dataChangeSubscriber.get(screenName)?.get(dataProvider)?.forEach(subFunction => subFunction.apply(undefined, []));
    }

    /**
     * Notifies the components which use the useMetadata hook that their metadata changed
     * @param screenName - the screen name of the screen
     * @param dataProvider - the dataprovider
     */
     notifyMetaDataChange(screenName:string, dataProvider: string) {
        this.metaDataSubscriber.get(screenName)?.get(dataProvider)?.forEach(subFunction => subFunction.apply(undefined, []));
    }

    /**
     * Notifies the components which use datadisplaymaps that their map changed
     * @param screenName - the screen name of the screen
     * @param dataProvider - the dataprovider
     */
    notifyLinkedDisplayMapChanged(screenName:string, dataProvider: string) {
        this.linkedDisplayMapSubscriber.get(screenName)?.get(dataProvider)?.forEach(subFunction => subFunction.apply(undefined, []));
    }

    /**
     * Notifies the components which use the useAllDataProviderData hook that the data of their screen changed
     * @param screenName - the screen name of the screen
     */
    notifyScreenDataChange(screenName:string) {
        this.screenDataChangeSubscriber.get(screenName)?.apply(undefined, []);
    }

    /**
     * Calls the function of the screen-title subscriber to change their state
     * @param screenTitle - the current screen-name
     */
    notifyScreenTitleChanged(screenTitle:string) {
        this.screenTitleSubscriber.apply(undefined, [screenTitle])
    }

    notifyTabTitleChanged(tabTitle:string) {
        this.tabTitleSubscriber.forEach(subFunction => subFunction.apply(undefined, [tabTitle]));
    }

    /**
     * Notifies every tree which uses the given master databook to update their state
     * @param masterDataBook - the master databook of the tree
     */
    notifyTreeChanged(masterDataBook:string) {
        this.treeSubscriber.get(masterDataBook)?.forEach(subFunction => subFunction.apply(undefined, []));
    }

    notifyTreeDataChanged(dataBook:string, data: any, pageKeyHelper:string, pDelete: boolean) {
        this.treeDataChangedSubscriber.forEach((v, k) => {
            const splitDataBooks = k.split("_");
            if (splitDataBooks.includes(dataBook)) {
                v(dataBook, data, pageKeyHelper, pDelete);
            }
        });
    }

    /**
     * Notifies every subscribed component of given screenName and dataProvider
     * @param screenName 
     * @param dataProvider 
     */
    notifySortDefinitionChange(screenName:string, dataProvider:string) {
        this.sortDefinitionSubscriber.get(screenName)?.get(dataProvider)?.forEach(subFunction => subFunction.apply(undefined, []));
    }

    notifyAppReadyParamsChange() {
        this.appReadyParamsSubscriber.apply(undefined, [this.appSettings.appReadyParams])
    }

    notifyMenuButtonItemsChange(id: string) {
        this.menuButtonItemsSubscriber.get(id)?.apply(undefined, []);
    }

    notifyUploadDialog(fileId: string) {
        this.uploadDialogSubscriber.apply(undefined, [fileId])
    }

    /**
     * When a new row is selected add the row selection to the jobQueue to avoid multiple state updates
     * @param screenName - the screen name of the screen
     * @param dataProvider - the dataprovider
     */
     emitRowSelect(screenName:string, dataProvider: string) {
        const rowSubscriber = this.rowSelectionSubscriber.get(screenName)?.get(dataProvider);
        const screenRowSubs = this.screenRowSelectionSubscriber.get(screenName);
        const selectedRow = this.contentStore.getDataBook(screenName, dataProvider)?.selectedRow;
        if(rowSubscriber) {
            //this.jobQueue.set("rowSelect_" + dataProvider + "_" + screenName, () => rowSubscriber.forEach(subFunction => subFunction.apply(undefined, [selectedRow])));
            /// Removed JobQueue because upload didn't work anymore, JobQueue is possibly not needed anymore or when problems with multiple rowSelections occur we need it back
            rowSubscriber.forEach(subFunction => subFunction.apply(undefined, [selectedRow]));
        }
            
        if (screenRowSubs) {
            //this.jobQueue.set("rowSelectAll", () => screenRowSubs.apply(undefined, []));
            screenRowSubs.apply(undefined, []);
        }
    }

    /** When the menu-items change, call the function of the menu-subscriber */
    emitMenuUpdate(){
        this.menuSubscriber.forEach(subFunction => subFunction.apply(undefined, [(this.contentStore as ContentStore).menuItems]));
    }

    /**
     * When menu collapses or expands, call the function of the menu-collapse subscriber and set the contentStore value
     * @param collapseVal - the collapse value
     */
    emitMenuCollapse(collapseVal:number) {
        this.menuCollapseSubscriber.forEach(subFunction => subFunction.apply(undefined, [collapseVal]))
        if (collapseVal === 0 && !this.appSettings.menuCollapsed)
            this.appSettings.menuCollapsed = true;
        else if (collapseVal === 1 && this.appSettings.menuCollapsed)
            this.appSettings.menuCollapsed = false;
        else if (collapseVal === 2)
            this.appSettings.menuCollapsed = !this.appSettings.menuCollapsed;
    }

    /** When the app is ready call the app-ready function */
    emitAppReady(ready:boolean) {
        this.appReadySubscriber.apply(undefined, [ready]);
    }

    /** Notify that change-password dialog is visible */
    emitChangePasswordVisible() {
        this.changePasswordVisibleSubscriber.apply(undefined, []);
    }

    /** Tell the error-bar that it should be displayed or not */
    emitErrorBarVisible(visible:boolean) {
        if (visible) {
            this.server.errorIsDisplayed = true;
        }
        else {
            this.server.errorIsDisplayed = false;
        }
        this.errorBarVisibleSubscriber.apply(undefined, [visible]);
    }

    /** Notify the error-bar about its properties */
    emitErrorBarProperties(sessionExpired:boolean, gone:boolean, dontShowRestart:boolean, priority:number, header?:string, body?:string, retryFunc?:Function) {
        this.errorBarPropertiesSubscriber.apply(undefined, [header, body, sessionExpired, priority, gone, retryFunc, dontShowRestart]);
    }

    emitErrorDialogProperties(errData: ErrorResponse) {
        this.errorDialogPropsSubscriber(errData)
    }

    /** Tell the subscribers to update their app-settings */
    emitAppSettings() {
        this.appSettingsSubscriber.forEach((subFunc) => subFunc.apply(undefined, [
            this.appSettings.menuOptions, 
            this.appSettings.visibleButtons, 
            this.appSettings.changePasswordEnabled 
        ]));
    }

    /** Tell the subscribers to update their app-settings */
    emitDeviceMode(deviceMode:DeviceStatus) {
        this.deviceModeSubscriber.forEach((subFunc) => subFunc.apply(undefined, [deviceMode]));
    }

    /** Tell the toolbar-subscribers that their items changed */
    emitToolBarUpdate() {
        this.toolbarSubscriber.forEach((subFunc) => subFunc.apply(undefined, [(this.contentStore as ContentStore).toolbarItems]));
    }

    emitRestart() {
        this.restartSubscriber.forEach((subFunc) => subFunc.apply(undefined, []));
    }

    /** Tell UIToast that there is a new message */
    emitToast(messageResponse:MessageResponse|ErrorResponse, err?:"error"|"info"|"warn"|"success") {
        this.toastSubscriber.apply(undefined, [messageResponse, err]);
    }

    /** Tell the close-frame subscribers that a frame has closed */
    emitCloseFrame() {
        this.closeFrameSubscriber.apply(undefined, []);
    }

    /** Tell the active-screen subscribers that the active-screens changed */
    emitActiveScreens() {
        this.activeScreenSubscriber.forEach((subFunc) => subFunc.apply(undefined, [this.contentStore.activeScreens]));
    }

    /**
     * Pass the dialog response to the message-dialog-properties subscribers
     * @param dialog - the message-dialog response sent by the server
     */
    emitMessageDialog(dialog:DialogResponse) {
        this.messageDialogPropsSubscriber.apply(undefined, [dialog])
    }

    /**
     * Notify that the css-version of application.css has been changed
     * @param version - the new version
     */
    emitAppCssVersion(version:string) {
        this.appCssVersionSubscriber.apply(undefined, [version]);
    }

    /**
     * Notify the theme subscribers that the theme changed
     * @param theme - the new theme
     */
    emitThemeChanged(theme:string) {
        this.themeSubscriber.forEach((subFunc) => subFunc.apply(undefined, [theme]))
    }

    /**
     * Notify the login-subscribers that the login-mode has changed or that there is an error-message
     * @param loginMode - the login-mode or undefined
     * @param errorMessage - the error-message or undefined
     */
    emitLoginChanged(loginMode?:LoginModeType, errorMessage?: string) {
        this.loginSubscriber.apply(undefined, [loginMode, errorMessage]);
    }

    /**
     * Notify the mfa-wait subscribers that the code and timeout changed
     * @param code - the new mfa code
     * @param timeout - the mfa timeout
     */
    emitMFAWaitChanged(code: string, timeout: number, timeoutReset?: boolean) {
        this.mFAWaitSubscriber.forEach((subFunc) => subFunc.apply(undefined, [code, timeout, timeoutReset]));
    }

    /**
     * Notify the mfa-url subscribers that the link and timeout changed
     * @param link - the new mfa link
     * @param timeout - the mfa timeout
     */
    emitMFAURLChanged(link: string|MFAURLType, timeout:number, timeoutReset?: boolean) {
        this.mFAURLSubscriber.forEach((subFunc) => subFunc.apply(undefined, [link, timeout, timeoutReset]));
    }

    emitLoginActive(isActive:boolean) {
        this.loginActiveSubscriber.apply(undefined, [isActive])
    }

    emitSessionExpiredChanged(sessionExpired:boolean) {
        this.sessionExpiredSubscriber.forEach(subFunc => subFunc.apply(undefined, [sessionExpired]));
    }
}