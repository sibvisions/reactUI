/** Other imports */
import AppSettings from "./AppSettings";
import ContentStore from "./ContentStore"
import { ApplicationSettingsResponse, DialogResponse, ErrorResponse, MessageResponse } from "./response";
import { DeviceStatus } from "./response/DeviceStatusResponse";

/** Manages subscriptions and handles the subscriber eventss */
export class SubscriptionManager {
    /** Contentstore instance */
    contentStore: ContentStore;

    /** AppSettings instance */
    appSettings: AppSettings;

    /** 
     * A Map which stores components which want to subscribe to their properties, 
     * the key is the component id and the value is a function to update the state of the properties 
     */
    propertiesSubscriber = new Map<string, Function>();

    /**
     * A Map which stores a function to update the state of a parents childcomponents, components which use the 
     * useComponents hook subscribe to the parentSubscriber the key is the component id and the 
     * value is a function to update the state of a parents childcomponents
     */
    parentSubscriber = new Map<string, Function>();

    /**
     * A Map which stores an Array of functions to update the state of a screens dataProviders, components which use
     * the useDataProviders hook subscribe to a screens dataProvider, the key is a screen component id and the
     * value is an Array of functions to update the subscribers dataProviders state
     */
    dataProvidersSubscriber = new Map<string, Array<Function>>();

    /**
     * A Map which stores another Map of dataproviders of a screen, it subscribes the components which use the 
     * useRowSelect hook, subscribe to the changes of a screens dataproviders selectedRow, the key is the screens component id and the
     * value is another Map which key is the dataprovider and the value is an array of functions to update the
     * subscribers selectedRow state
     */
    rowSelectionSubscriber = new Map<string, Map<string, Array<Function>>>();

    /**
     * A Map which stores a function to update a components state of all dataproviders selected-row, key is the screens component id
     * and value is the function to update the state
     */
    screenRowSelectionSubscriber = new Map<string, Function>();

    /**
     * A Map which stores another Map of dataproviders of a screen, it subscribes the components which use the
     * useDataProviderData hook, subscribe to the changes of a screens dataproviders data, the key is the screens component id and the
     * value is another Map which key is the dataprovider and the value is an array of functions to update the
     * subscribers data state
     */
    dataChangeSubscriber = new Map<string, Map<string, Array<Function>>>();

    /**
     * A Map which stores another Map of dataproviders of a screen, it subscribes the components which use the
     * useMetadata hook, subscribe to the changes of a screens dataproviders metadata, the key is the screens component id and the
     * value is another Map which key is the dataprovider and the value is an array of functions to update the
     * subscribers metadata state
     */
    metaDataSubscriber = new Map<string, Map<string, Array<Function>>>();

    /**
     * A Map which stores a function to update a components state of all dataproviders data, key is the screens component id
     * value is the function to update the state
     */
    screenDataChangeSubscriber = new Map<string, Function>();

    /**
     * A Map which stores a function to update the screen-name state of the subscribers, the key is the name of the subscribers
     * and the value is the function to update the screen-name state
     */
    screenNameSubscriber = new Map<string, Function>();

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

    /** An array of functions to update the menuitem states of its subscribers */
    menuSubscriber = new Array<Function>();

    /** An array of functions to update the translationLoaded state of components which use the useTranslationLoaded hook */
    translationLoadedSubscriber = new Array<Function>();

    /** A function to change the appReady state to true */
    appReadySubscriber:Function = () => {};

    /** A Map which stores functions to set the dialog-visibility of certain dialogs */
    dialogSubscriber = new Map<string, Function>();

    /** A function to update the selectedMenuItem */
    selectedMenuItemSubscriber:Function = () => {};

    sessionExpiredSubscriber:Function = () => {};

    /** A function to update which menubuttons should be visible */
    appSettingsSubscriber = new Array<Function>();

    /** An array of functions to change the deviceMode state */
    deviceModeSubscriber = new Array<Function>();
 
    /**
     * A Map which stores another Map of dataproviders of a screen, it subscribes the components which use the
     * useSortDefinitions hook, subscribe to the changes of a screens sort-definitions, the key is the screens component id and the
     * value is another Map which key is the dataprovider and the value is an array of functions to update the
     * subscribers sort-definition state
     */
    sortDefinitionSubscriber = new Map<string, Map<string, Array<Function>>>();

    /** An array of functions to update the toolbar items */
    toolbarSubscriber = new Array<Function>();

    /** A function to update the message-subscriber */
    messageSubscriber:Function = () => {};

    /** A function to update the close-frame-subscriber */
    closeFrameSubscriber:Function = () => {};

    /** An array of functions to update the active-screen subscriber */
    activeScreenSubscriber = new Array<Function>();

    missingDataSubscriber = new Map<string, Array<Function>>();

    /** 
     * A Map with functions to update the state of components, is used for when you want to wait for the responses to be handled and then
     * call the state updates to reduce the amount of state updates/rerenders
     */
    jobQueue:Map<string, any> = new Map();

    /**
     * @constructor constructs server instance
     * @param store - contentstore instance
     */
    constructor(store: ContentStore) {
        this.contentStore = store;
        this.appSettings = new AppSettings(store, this);
    }

    setAppSettings(appSettings:AppSettings) {
        this.appSettings = appSettings
    }

    handleCompIdDataProviderSubscriptions(compId:string, dataProvider:string, fn:Function, subs:Map<string, Map<string, Array<Function>>>) {
        /** Checks if there is already a Map for the dataChangeSubscriber */
        const existingMap = subs.get(compId);
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
            subs.set(compId, tempMap);
        }
    }

    handleCompIdDataProviderUnsubs(compId:string, dataProvider:string, fn:Function, subs:Map<string, Map<string, Array<Function>>>) {
        const subscriber = subs.get(compId)?.get(dataProvider)
        if(subscriber)
            subscriber.splice(subscriber.findIndex(subFunction => subFunction === fn),1);
    }

    /**
     * Subscribes the component which uses the useProperties hook, with the id to property changes
     * @param id - the component id
     * @param fn - the function to update the component's properties state
     */
    subscribeToPropChange(id: string, fn: Function){
        this.propertiesSubscriber.set(id, fn);
    }

    /**
     * Subscribes parents which use the useComponents hook, to change their childcomponent state
     * @param id - the component id
     * @param fn - the function to update a parents childcomponent state
     */
    subscribeToParentChange(id: string, fn: Function){
        this.parentSubscriber.set(id, fn);
    }

    /**
     * Subscribes components which use the useDataProviders hook, to change their dataProviders state
     * @param compId - the component id of the screen
     * @param fn - the function to update the dataProviders state
     */
    subscribeToDataProviders(compId:string, fn:Function) {
        /** Check if there is already a function array for this screen */
        const subscriber = this.dataProvidersSubscriber.get(compId);
        if (subscriber)
            subscriber.push(fn)
        else
            this.dataProvidersSubscriber.set(compId, new Array<Function>(fn));
    }

    /**
     * Subscribes components which use the useRowSelect hook, to change their selectedRow state
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the selectedRow state
     */
    subscribeToRowSelection(compId:string, dataProvider: string, fn: Function) {
        this.handleCompIdDataProviderSubscriptions(compId, dataProvider, fn, this.rowSelectionSubscriber);
    }

    /**
     * Subscribes components which use the useDataProviderData hook, to change their data state
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the data state
     */
    subscribeToDataChange(compId:string, dataProvider: string, fn: Function) {
        this.handleCompIdDataProviderSubscriptions(compId, dataProvider, fn, this.dataChangeSubscriber);
    }

    /**
     * Subscribes components which use the useMetadata hook, to change their metadata state
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the data state
     */
    subscribeToMetaData(compId:string, dataProvider:string, fn: Function) {
        this.handleCompIdDataProviderSubscriptions(compId, dataProvider, fn, this.metaDataSubscriber);
    }

    /**
     * Subscribes a component to its screen-data (every dataprovider data)
     * @param compId - the component id of the screen
     * @param fn - the function to update the state
     */
    subscribeToScreenDataChange(compId:string, fn:Function) {
        this.screenDataChangeSubscriber.set(compId, fn)
    }

    /**
     * Subscribes a component to its dataproviders selected-rows
     * @param compId - the component id of the screen
     * @param fn - the function to update the state
     */
    subscribeToScreenRowChange(compId:string, fn:Function) {
        this.screenRowSelectionSubscriber.set(compId, fn);
    }

    /**
     * Subscribes components to the screen-name, to change their screen-name state
     * @param id - the id of the component
     * @param fn - the function to update the screen-name state
     */
    subscribeToScreenName(id:string, fn: Function) {
        this.screenNameSubscriber.set(id, fn);
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
     * @param id - the component id
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

    /**
     * Subscribes components to translationLoaded , to change the translation-loaded state
     * @param fn - the function to update the translation-loaded state
     */
    subscribeToTranslation(fn: Function) {
        this.translationLoadedSubscriber.push(fn);
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
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the state
     */
    subscribeToSortDefinitions(compId:string, dataProvider:string, fn:Function) {
        this.handleCompIdDataProviderSubscriptions(compId, dataProvider, fn, this.sortDefinitionSubscriber);
    }

    /**
     * Subscribes the login to change-dialog, to change the change-dialog state, to show the
     * change-password-dialog
     * @param fn - the function to change the change-dialog state
     */
    subscribeToDialog(id:string, fn:Function) {
        this.dialogSubscriber.set(id, fn);
    }

    /**
     * Subscribes the login to change-dialog, to change the change-dialog state, to show the
     * change-password-dialog
     * @param fn - the function to change the change-dialog state
     */
    subscribeToSelectedMenuItem(fn:Function) {
        this.selectedMenuItemSubscriber = fn;
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
     * Subscribes the app to session-expired to flip the flag and reinitiate
     * @param fn - the function to flip the session-expired-state
     */
    subscribeToSessionExpired(fn:Function) {
        this.sessionExpiredSubscriber = fn;
    }

    /**
     * Subscribes the UIToast to message-responses, to change the dialog-response state, to show the
     * UIToast
     * @param fn - the function to change the dialog-response state
     */
     subscribeToMessage(fn:Function) {
        this.messageSubscriber = fn;
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
     * @param fn - the function to update the toolbar-items
     */
     subscribeToActiveScreens(fn: Function) {
        this.activeScreenSubscriber.push(fn);
    }

    subscribeToMissingData(compId:string, fn:Function) {
        const subscriber = this.missingDataSubscriber.get(compId);
        if (subscriber)
            subscriber.push(fn)
        else
            this.treeSubscriber.set(compId, new Array<Function>(fn));
    }

    /**
     * Unsubscribes the menu from menuChanges
     * @param fn - the function to update the menu-item state
     */
    unsubscribeFromMenuChange(fn: Function){
        this.menuSubscriber.splice(this.menuSubscriber.findIndex(subFunction => subFunction === fn), 1);
    }

    /**
     * Unsubscribes components from translationLoaded
     * @param fn - the function to update the translation-loaded state
     */
    unsubscribeFromTranslation(fn: Function) {
        this.translationLoadedSubscriber.splice(this.translationLoadedSubscriber.findIndex(subFunction => subFunction === fn), 1);
    }

    /**
    * Unsubscribes components from dataProviders
    * @param compId - the component id of the screen
    * @param fn - the function to update the dataProvider state
    */
    unsubscribeFromDataProviders(compId:string, fn: Function) {
        const subscriber = this.dataProvidersSubscriber.get(compId);
        if (subscriber)
            subscriber.splice(subscriber.findIndex(subFunction => subFunction === fn), 1)
    }

    /**
     * Unsubscibes components from dataChange
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the data state
     */
    unsubscribeFromDataChange(compId:string, dataProvider: string, fn: Function) {
        this.handleCompIdDataProviderUnsubs(compId, dataProvider, fn, this.dataChangeSubscriber);
    }

    /**
     * Unsubscibes components from dataChange
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the data state
     */
     unsubscribeFromMetaData(compId:string, dataProvider: string, fn: Function) {
        this.handleCompIdDataProviderUnsubs(compId, dataProvider, fn, this.metaDataSubscriber);
    }

    /**
     * Unsubscribes a component from its screen-data (every dataprovider data)
     * @param compId - the component id of the screen
     */
    unsubscribeFromScreenDataChange(compId:string) {
        this.screenDataChangeSubscriber.delete(compId);
    }

    /**
     * Unsubscribes a component from its dataproviders selected-rows
     * @param compId 
     */
    unsubscribeFromScreenRowChange(compId:string) {
        this.screenRowSelectionSubscriber.delete(compId);
    }

    /**
     * Unsubscribes a component from rowSelection
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the selectedRow state
     */
    unsubscribeFromRowSelection(compId:string, dataProvider: string, fn: Function){
        this.handleCompIdDataProviderUnsubs(compId, dataProvider, fn, this.rowSelectionSubscriber);
    }

    /**
     * Unsubscribes a component from parentChanges
     * @param id - the component id
     */
    unsubscribeFromParentChange(id: string){
        this.parentSubscriber.delete(id);
    }

    /**
     * Unsubscribes a component from property changes
     * @param id - the component id
     */
    unsubscribeFromPropChange(id: string){
        this.propertiesSubscriber.delete(id);
    }

    /**
     * Unsubscribes a component from screen-name changes
     * @param id - the component id
     */
    unsubscribeFromScreenName(id: string) {
        this.screenNameSubscriber.delete(id)
    }

    /**
     * Unsubscribes a component from menu-collapse
     * @param id - the component id
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

    /**
     * Unsubscribes app from app-ready
     */
    unsubscribeFromAppReady() {
        this.appReadySubscriber = () => {}
    }

    /**
     * Unsubscribes login from change-dialog
     */
    unsubscribeFromDialog(id:string) {
        this.dialogSubscriber.delete(id);
    }

    /**
     * Unsubscribes login from change-dialog
     */
    unsubscribeFromSelectedMenuItem() {
        this.selectedMenuItemSubscriber = () => {};
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
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update sort-definition
     */
    unsubscribeFromSortDefinitions(compId:string, dataProvider:string, fn: Function) {
        this.handleCompIdDataProviderUnsubs(compId, dataProvider, fn, this.sortDefinitionSubscriber);
    }
    
    /**
     * Unsubscribes a component from toolbar-items
     * @param fn - the function to update the toolbar-items
     */
    unsubscribeFromToolBarItems(fn:Function) {
        this.deviceModeSubscriber.splice(this.deviceModeSubscriber.findIndex(subFunction => subFunction === fn), 1);
    }

    /** Unsubscribes app from session-expired */
    unsubscribeFromSessionExpired() {
        this.sessionExpiredSubscriber = () => {};
    }

    /** Unsubscribes UIToast from message-responses */
    unsubscribeFromMessage() {
        this.messageSubscriber = () => {};
    }

    /** Unsubscribes UIToast from close-frame-responses */
    unsubscribeFromCloseFrame() {
        this.closeFrameSubscriber = () => {};
    }

    /**
     * Unsubscribes from active-screens
     */
     unsubscribeFromActiveScreens(fn:Function) {
        this.activeScreenSubscriber.splice(this.activeScreenSubscriber.findIndex(subFunction => subFunction === fn), 1);
    }

    unsubscribeFromMissingData(compId:string, fn: Function) {
        const subscriber = this.missingDataSubscriber.get(compId)
        if (subscriber)
            subscriber.splice(subscriber.findIndex(subFunction => subFunction === fn),1);
    }

    /**
     * Notifies the components which use the useDataProviders hook that their dataProviders changed
     * @param compId 
     */
    notifyDataProviderChange(compId:string) {
        this.dataProvidersSubscriber.get(compId)?.forEach(subFunction => subFunction.apply(undefined, []));
    }

    /**
     * Notifies the components which use the useDataProviderData hook that their data changed
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     */
    notifyDataChange(compId:string, dataProvider: string) {
        this.dataChangeSubscriber.get(compId)?.get(dataProvider)?.forEach(subFunction => subFunction.apply(undefined, []));
    }

    /**
     * Notifies the components which use the useMetadata hook that their metadata changed
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     */
     notifyMetaDataChange(compId:string, dataProvider: string) {
        this.metaDataSubscriber.get(compId)?.get(dataProvider)?.forEach(subFunction => subFunction.apply(undefined, []));
    }

    /**
     * Notifies the components which use the useAllDataProviderData hook that the data of their screen changed
     * @param compId - the component id of the screen
     */
    notifyScreenDataChange(compId:string) {
        this.screenDataChangeSubscriber.get(compId)?.apply(undefined, []);
    }

    /**
     * Calls the function of the screen-name subscribers to change their state
     * @param screenName - the current screen-name
     */
    notifyScreenNameChanged(screenName:string) {
        this.screenNameSubscriber.forEach(subFunction => subFunction.apply(undefined, [screenName]))
    }

    /**
     * Notifies every tree which uses the given master databook to update their state
     * @param masterDataBook - the master databook of the tree
     */
    notifyTreeChanged(masterDataBook:string) {
        this.treeSubscriber.get(masterDataBook)?.forEach(subFunction => subFunction.apply(undefined, []));
    }

    /**
     * Notifies every subscribed component of given compId and dataProvider
     * @param compId 
     * @param dataProvider 
     */
    notifySortDefinitionChange(compId:string, dataProvider:string) {
        this.sortDefinitionSubscriber.get(compId)?.get(dataProvider)?.forEach(subFunction => subFunction.apply(undefined, []));
    }

    notifyMissingDataChanged(compId:string) {
        this.missingDataSubscriber.get(compId)?.forEach(subFunction => subFunction.apply(undefined, []));
    }

    /**
     * When a new row is selected add the row selection to the jobQueue to avoid multiple state updates
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     */
     emitRowSelect(compId:string, dataProvider: string){
        const rowSubscriber = this.rowSelectionSubscriber.get(compId)?.get(dataProvider);
        const screenRowSubs = this.screenRowSelectionSubscriber.get(compId);
        const selectedRow = this.contentStore.dataProviderSelectedRow.get(compId)?.get(dataProvider);
        if(rowSubscriber) {
            this.jobQueue.set("rowSelect_" + dataProvider, () => rowSubscriber.forEach(subFunction => subFunction.apply(undefined, [selectedRow])));
        }
            
        if (screenRowSubs) {
            this.jobQueue.set("rowSelectAll", () => screenRowSubs.apply(undefined, []));
        }
    }

    /** When the menu-items change, call the function of the menu-subscriber */
    emitMenuUpdate(){
        this.menuSubscriber.forEach(subFunction => subFunction.apply(undefined, [this.contentStore.menuItems]));
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

    /** When the translation is loaded, notify the subscribers */
    emitTranslation() {
        this.translationLoadedSubscriber.forEach(subFunction => subFunction.apply(undefined, [this.contentStore.translation]));
    }

    /** When the app is ready call the app-ready function */
    emitAppReady() {
        this.appReadySubscriber.apply(undefined, []);
    }

    /** Tell the subscribers to show the change-password-dialog */
    emitErrorDialog(id:string, header?:string, body?:string) {
        const func = this.dialogSubscriber.get(id);
        if (func) {
            func.apply(undefined, [header, body]);
        }
    }

    /** Tell the subscribers to change their selectedmenuitem */
    emitSelectedMenuItem(menuItem:string) {
        this.selectedMenuItemSubscriber.apply(undefined, [menuItem]);
    }

    /** Tell the subscribers to update their app-settings */
    emitAppSettings(appSettings:ApplicationSettingsResponse) {
        this.appSettingsSubscriber.forEach((subFunc) => subFunc.apply(undefined, [appSettings]));
    }

    /** Tell the subscribers to update their app-settings */
    emitDeviceMode(deviceMode:DeviceStatus) {
        this.deviceModeSubscriber.forEach((subFunc) => subFunc.apply(undefined, [deviceMode]));
    }

    /** Tell the toolbar-subscribers that their items changed */
    emitToolBarUpdate() {
        this.toolbarSubscriber.forEach((subFunc) => subFunc.apply(undefined, [this.contentStore.toolbarItems]));
    }

    /** Tell app that session has expired */
    emitSessionExpired() {
        this.sessionExpiredSubscriber.apply(undefined, []);
    }

    /** Tell UIToast that there is a new message */
    emitMessage(messageResponse:MessageResponse|ErrorResponse, err?:"error"|"info") {
        this.messageSubscriber.apply(undefined, [messageResponse, err]);
    }

    emitCloseFrame(compId:string) {
        this.closeFrameSubscriber.apply(undefined, [compId]);
    }

    emitActiveScreens() {
        this.activeScreenSubscriber.forEach((subFunc) => subFunc.apply(undefined, [this.contentStore.activeScreens]));
    }

    emitMessageDialog(id:string, dialog:DialogResponse) {
        const func = this.dialogSubscriber.get(id);
        if (func) {
            func.apply(undefined, [dialog]);
        }
    }
}