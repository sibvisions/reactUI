import ContentStore from "./ContentStore"

/** Manages subscriptions and handles the subscriber eventss */
export class SubscriptionManager {
    /**
     * @constructor constructs server instance
     * @param store - contentstore instance
     */
    constructor(store: ContentStore) {
        this.contentStore = store
    }
    /** Contentstore instance */
    contentStore: ContentStore;
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
     * A Map which stores another Map of dataproviders of a screen, it subscribes the components which use the 
     * useRowSelect hook, to the changes of a screens dataproviders selectedRow, the key is the screens component id and the
     * value is another Map which key is the dataprovider and the value is an array of functions to update the
     * subscribers selectedRow state
     */
    rowSelectionSubscriber = new Map<string, Map<string, Array<Function>>>();
    /**
     * A Map which stores another Map of dataproviders of a screen, it subscribes the components which use the
     * useDataProviderData hook, to the changes of a screens dataproviders data, the key is the screens component id and the
     * value is another Map which key is the dataprovider and the value is an array of functions to update the
     * subscribers data state
     */
    dataChangeSubscriber = new Map<string, Map<string, Array<Function>>>();
    /**
     * A Map which stores a function to update a components state of all dataprovider data, key is the screens component id
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
    /** An array of functions to update the menuitem states of its subscribers */
    menuSubscriber = new Array<Function>();
    /** An array of functions to update the homechildren state of components which use the useHomeComponents hook */
    popupSubscriber = new Array<Function>();
    /** An array of functions to update the translationLoaded state of components which use the useTranslationLoaded hook */
    translationLoadedSubscriber = new Array<Function>();
    /** A function to change the register custom content state of a component*/
    registerCustomSubscriber:Function = () => {};

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
     * Subscribes components which use the useRowSelect hook, to change their selectedRow state
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the selectedRow state
     */
    subscribeToRowSelection(compId:string, dataProvider: string, fn: Function) {
        /** Checks if there is already a Map for the rowSelectionSubscriber */
        const existingMap = this.rowSelectionSubscriber.get(compId);
        if (existingMap) {
            /** Checks if there already is a function array of other components, if yes add the new function if not add the dataprovider with an array */
            const subscriber = existingMap.get(dataProvider);
            if(subscriber)
                subscriber.push(fn);
            else
                existingMap.set(dataProvider, new Array<Function>(fn));
        }
        else {
            const tempMap:Map<string, Function[]> = new Map<string, Function[]>();
            tempMap.set(dataProvider, new Array<Function>(fn));
            this.rowSelectionSubscriber.set(compId, tempMap);
        }
    }

    /**
     * Subscribes components which use the useDataProviderData hook, to change their data state
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the data state
     */
    subscribeToDataChange(compId:string, dataProvider: string, fn: Function){
        /** Checks if there is already a Map for the dataChangeSubscriber */
        const existingMap = this.dataChangeSubscriber.get(compId);
        if (existingMap) {
            /** Checks if there already is a function array of other components, if yes add the new function if not add the dataprovider with an array */
            const subscriber = existingMap.get(dataProvider);
            if(subscriber)
                subscriber.push(fn);
            else
                existingMap.set(dataProvider, new Array<Function>(fn));
        }
        else {
            const tempMap:Map<string, Array<Function>> = new Map();
            tempMap.set(dataProvider, new Array<Function>(fn));
            this.dataChangeSubscriber.set(compId, tempMap);
        }
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
     * Subscribes components to popUpChanges, to change their homeComponents state
     * @param fn - the function to add or remove popups to the state
     */
    subscribeToPopupChange(fn: Function) {
        this.popupSubscriber.push(fn);
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
     * Subscribes components to translationLoaded , to change the translation-loaded state
     * @param fn - the function to update the translation-loaded state
     */
    subscribeToTranslation(fn: Function) {
        this.translationLoadedSubscriber.push(fn);
    }

    /**
     * Subscribes the app to register-custom, to change the register-custom flip value
     * @param fn - the function to update the register-custom flip value
     */
    subscribeToRegisterCustom(fn:Function) {
        this.registerCustomSubscriber = fn;
    }

    /**
     * Unsubscribes a component from popUpChanges
     * @param fn - the function to add or remove popups to the state
     */
    unsubscribeFromPopupChange(fn: Function) {
        this.popupSubscriber.splice(this.popupSubscriber.findIndex(value => value === fn), 1);
    }

    /**
     * Unsubscribes the menu from menuChanges
     * @param fn - the function to update the menu-item state
     */
    unsubscribeFromMenuChange(fn: Function){
        this.menuSubscriber.splice(this.menuSubscriber.findIndex(value => value === fn), 1);
    }

    /**
     * Unsubscribes components from translationLoaded
     * @param fn - the function to update the translation-loaded state
     */
    unsubscribeFromTranslation(fn: Function) {
        this.translationLoadedSubscriber.splice(this.translationLoadedSubscriber.findIndex(value => value === fn), 1);
    }

    /**
     * Unsubscibes components from dataChange
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the data state
     */
    unsubscribeFromDataChange(compId:string, dataProvider: string, fn: Function){
        const subscriber = this.dataChangeSubscriber.get(compId)?.get(dataProvider)
        if(subscriber){
            subscriber.splice(subscriber.findIndex(value => value === fn),1);
        }
    }

    /**
     * Unsubscribes a component from its screen-data (every dataprovider data)
     * @param compId - the component id of the screen
     */
    unsubscribeFromScreenDataChange(compId:string) {
        this.screenDataChangeSubscriber.delete(compId);
    }

    /**
     * Unsubscribes a component from rowSelection
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     * @param fn - the function to update the selectedRow state
     */
    unsubscribeFromRowSelection(compId:string, dataProvider: string, fn: Function){
        const subscriber = this.rowSelectionSubscriber.get(compId)?.get(dataProvider)
        if(subscriber){
            subscriber.splice(subscriber.findIndex(value => value === fn),1);
        }
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
     * Unsubscribes app from register-custom
     */
    unsubscribeFromRegisterCustom() {
        this.subscribeToRegisterCustom = () => {}
    }

    /**
     * Notifies the components which use the useDataProviderData hook that their data changed
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     */
    notifyDataChange(compId:string, dataProvider: string) {
        this.dataChangeSubscriber.get(compId)?.get(dataProvider)?.forEach(value => {
            value.apply(undefined, []);
        });
    }

    /**
     * Notifies the components which use the useScreenData hook that the data of their screen changed
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
        this.screenNameSubscriber.forEach(subscriber => {
                subscriber.apply(undefined, [screenName])
        })
    }

    /**
     * When a new row is selected call the function of the subscriber
     * @param compId - the component id of the screen
     * @param dataProvider - the dataprovider
     */
     emitRowSelect(compId:string, dataProvider: string){
        const rowSubscriber = this.rowSelectionSubscriber.get(compId)?.get(dataProvider);
        const selectedRow = this.contentStore.dataProviderSelectedRow.get(compId)?.get(dataProvider);
        if(rowSubscriber)
            rowSubscriber.forEach(sub => {
                sub.apply(undefined, [selectedRow]);
            });
    }

    /** When the menu-items change, call the function of the menu-subscriber */
    emitMenuUpdate(){
        this.menuSubscriber.forEach(subFunction => {
            subFunction.apply(undefined, [this.contentStore.mergedMenuItems]);
        });
    }

    /**
     * When menu collapses or expands, call the function of the menu-collapse subscriber and set the contentStore value
     * @param collapseVal - the collapse value
     */
    emitMenuCollapse(collapseVal:number) {
        this.menuCollapseSubscriber.forEach(subFunction => {
            subFunction.apply(undefined, [collapseVal]);
        })
        if (collapseVal === 0 && !this.contentStore.menuCollapsed)
            this.contentStore.menuCollapsed = true;
        else if (collapseVal === 1 && this.contentStore.menuCollapsed)
            this.contentStore.menuCollapsed = false;
        else if (collapseVal === 2)
            this.contentStore.menuCollapsed = !this.contentStore.menuCollapsed;
    }

    /** When the translation is loaded, notify the subscribers */
    emitTranslation() {
        this.translationLoadedSubscriber.forEach(subFunction => {
            subFunction.apply(undefined, [this.contentStore.translation]);
        });
    }

    /** When the app needs to reregister the custom content*/
    emitRegisterCustom() {
        this.registerCustomSubscriber()
    }
}