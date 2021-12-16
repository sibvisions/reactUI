import BaseComponent from "./components/BaseComponent";
import { addCSSDynamically } from "./components/util";
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
    applicationLayout: { layout: "standard"|"corporation"|"modern", urlSet: boolean }
    applicationColorScheme: { value: string, urlSet: boolean }
    applicationTheme: { value: string, urlSet: boolean }
    applicationName: string
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

    /** The language of the app */
    language:string = "de";

    /** The timezone of the app */
    timezone:string = "CET";

    /** The devicemode of the client */
    deviceMode:string = "desktop";

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
        applicationLayout: { layout: "standard", urlSet: false },
        applicationTheme: { value: "basti", urlSet: false },
        applicationColorScheme: { value: "default", urlSet: false },
        applicationName: ""
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

    /** True, if the menu is collapsed, default value based on window width */
    menuCollapsed:boolean = ["Small", "Mini"].indexOf(this.deviceStatus) !== -1;

    welcomeScreen:string = "";

    desktopPanel:BaseComponent|undefined;

    /**
     * Sets the menu-mode
     * @param value - the menu-mode
     */
     setMenuModeAuto(value: boolean) {
        this.menuModeAuto = value;
    }

    setMenuCollapsed(collapsedVal:boolean) {
        this.menuCollapsed = collapsedVal;
    }

    /**
     * Sets the current login-mode
     * @param mode - the login-mode
     */
     setLoginMode(mode:LoginModeType) {
        this.loginMode = mode;
        if (mode === "changePassword" || mode === "changeOneTimePassword") {
            this.#subManager.emitDialog("change-password", false);
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

        if (!this.applicationMetaData.applicationLayout.urlSet) {
            this.applicationMetaData.applicationLayout.layout = appMetaData.applicationLayout
        }

        if (appMetaData.applicationName) {
            this.applicationMetaData.applicationName = appMetaData.applicationName;
            this.#subManager.notifyAppNameChanged(appMetaData.applicationName);
            this.#subManager.notifyScreenTitleChanged(appMetaData.applicationName);
        }

        if (!this.applicationMetaData.applicationColorScheme.urlSet) {
            if (appMetaData.applicationColorScheme) {
                this.applicationMetaData.applicationColorScheme.value = appMetaData.applicationColorScheme;
                addCSSDynamically('color-schemes/' + appMetaData.applicationColorScheme + '-scheme.css', "scheme");
            }
            else {
                addCSSDynamically('color-schemes/default-scheme.css', "scheme");
            }
        }
        
        if (!this.applicationMetaData.applicationTheme.urlSet) {
            if (appMetaData.applicationTheme) {
                this.applicationMetaData.applicationTheme.value = appMetaData.applicationTheme;
                addCSSDynamically('themes/' + appMetaData.applicationTheme + '.css', "theme");
            }
            else {
                addCSSDynamically('themes/basti.css', "theme");
            }
            this.#subManager.emitThemeChanged(appMetaData.applicationTheme);
        }
    }

    setApplicationThemeByURL(pTheme:string) {
        this.applicationMetaData.applicationTheme = { value: pTheme, urlSet: true };
    }

    setApplicationColorSchemeByURL(pScheme:string) {
        this.applicationMetaData.applicationColorScheme = { value: pScheme, urlSet: true };
    }

    setApplicationLayoutByURL(pLayout:"standard"|"corporation"|"modern") {
        this.applicationMetaData.applicationLayout = { layout: pLayout, urlSet: true };
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