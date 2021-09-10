import BaseComponent from "./components/BaseComponent";
import ContentStore from "./ContentStore";
import { ApplicationMetaDataResponse, ApplicationSettingsResponse, LoginModeType } from "./response";
import { DeviceStatus } from "./response/DeviceStatusResponse";
import { SubscriptionManager } from "./SubscriptionManager";

type ApplicationMetaData = {
    version: string
    clientId: string
    langCode: string
    languageResource: string
    lostPasswordEnabled: boolean
    preserveOnReload: boolean
    applicationLayout: "standard"|"corporation"|"modern"
}

/** Interface for whether specific buttons should be visible or not */
export type VisibleButtons = {
    reload:boolean
    rollback:boolean
    save:boolean
}

/** Interface if the toolbar or the menubar should be visible or not */
export type MenuVisibility = {
    toolBar:boolean
    menuBar:boolean
}

/** The AppSettings stores settings and flags for the application */
export default class AppSettings {
    /** Contentstore instance */
    #contentStore:ContentStore
    /** SubscriptionManager instance */
    #subManager:SubscriptionManager

    constructor(store:ContentStore, subManager:SubscriptionManager) {
        this.#contentStore = store
        this.#subManager = subManager
    }

    /** The logo to display when the menu is expanded */
    LOGO_BIG:string = "/assets/logo_big.png";

    /** The logo to display when the menu is collapsed */
    LOGO_SMALL:string = "/assets/logo_small.png";

    /** The logo to display at the login screen */
    LOGO_LOGIN:string = "/assets/logo_login.png";

    /** The current region */
    locale:string = "de-DE";

    /** True, if the menu is collapsed, default value based on window width */
    menuCollapsed:boolean = window.innerWidth <= 1030 ? true : false;

    /**
     * If true the menu will collapse/expand based on window size, if false the menus position will be locked while resizing,
     * the value gets reset to true if the window width goes from less than 1030 pixel to more than 1030 pixel and menuModeAuto is false
     */
    menuModeAuto:boolean = true;

    /** True, if the menu should overlay the layout in mini mode */
    menuOverlaying:boolean = true;

    /** The current login mode sent by the server */
    loginMode:LoginModeType;

    /** The application-metadata object */
    applicationMetaData:ApplicationMetaData = { 
        version: "", 
        clientId: "", 
        langCode: "", 
        languageResource: "", 
        lostPasswordEnabled: false, 
        preserveOnReload: false, 
        applicationLayout: "standard" 
    };

    /** The visible-buttons object */
    visibleButtons:VisibleButtons = { 
        reload: false, 
        rollback: false, 
        save: false 
    }

    /** The menu-visibility object */
    menuVisibility:MenuVisibility = {
        menuBar: false,
        toolBar: false
    }

    /** True, if change password enabled */
    changePasswordEnabled = false;

    deviceStatus:DeviceStatus = "Full";

    welcomeScreen:string = "";

    desktopPanel:BaseComponent|undefined;

    /**
     * Sets the menu-mode
     * @param value - the menu-mode
     */
     setMenuModeAuto(value: boolean) {
        this.menuModeAuto = value;
    }

    /**
     * Sets the current login-mode
     * @param mode - the login-mode
     */
     setLoginMode(mode:LoginModeType) {
        this.loginMode = mode;
        if (mode === "changePassword" || mode === "changeOneTimePassword") {
            this.#subManager.emitShowDialog("change-password");
        }
    }

    /**
     * Sets the application-metadata
     * @param appMetaData - The application-metadata
     */
     setApplicationMetaData(appMetaData:ApplicationMetaDataResponse) {
        this.applicationMetaData.version = appMetaData.version;
        this.applicationMetaData.clientId = appMetaData.clientId;
        this.applicationMetaData.langCode = appMetaData.langCode;
        this.applicationMetaData.languageResource = appMetaData.languageResource;
        this.applicationMetaData.lostPasswordEnabled = appMetaData.lostPasswordEnabled;
        this.applicationMetaData.preserveOnReload = appMetaData.preserveOnReload;
        this.applicationMetaData.applicationLayout = appMetaData.applicationLayout
    }

    /**
     * Sets the visible buttons
     * @param reload - whether the reload button is visible or not
     * @param rollback - whether the rollback button is visible or not
     * @param save - whether the save button is visible or not
     */
     setVisibleButtons(reload:boolean, rollback:boolean, save:boolean) {
        this.visibleButtons.reload = reload;
        this.visibleButtons.rollback = rollback;
        this.visibleButtons.save = save;
    }

    /**
     * Sets if change-password is enabled
     * @param cpe - changed-password enabled value
     */
    setChangePasswordEnabled(cpe:boolean) {
        this.changePasswordEnabled = cpe;
    }

    /**
     * Sets the menu-visibility
     * @param menuBar - True, if the menubar is visible
     * @param toolBar - True, if the toolbar is visible
     */
    setMenuVisibility(menuBar:boolean, toolBar:boolean) {
        this.menuVisibility.menuBar = menuBar;
        this.menuVisibility.toolBar = toolBar;
    }

    setDeviceStatus(deviceStatus:DeviceStatus) {
        this.deviceStatus = deviceStatus;
    }

    setWelcomeScreen(welcomeScreen:string) {
        this.welcomeScreen = welcomeScreen;
    }

    setDesktopPanel(desktopPanel:BaseComponent) {
        if (this.desktopPanel !== undefined) {
            for (let newProp in desktopPanel) {
                //@ts-ignore
                this.desktopPanel[newProp] = desktopPanel[newProp];
            }
        }
        else {
            this.desktopPanel = desktopPanel;
        }
    }
}