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

import BaseComponent from "./util/types/BaseComponent";
import { addCSSDynamically } from "./util/html-util/AddCSSDynamically";
import ContentStore from "./contentstore/ContentStore";
import { DeviceStatus } from "./response/event/DeviceStatusResponse";
import { SubscriptionManager } from "./SubscriptionManager";
import BaseContentStore from "./contentstore/BaseContentStore";
import ContentStoreFull from "./contentstore/ContentStoreFull";
import { LoginModeType } from "./response/login/LoginResponse";
import ApplicationMetaDataResponse from "./response/app/ApplicationMetaDataResponse";

type ApplicationMetaData = {
    clientId: string,
    langCode: string,
    languageResource: string,
    lostPasswordEnabled: boolean,
    preserveOnReload: boolean,
    applicationLayout: { layout: "standard"|"corporation"|"modern", urlSet: boolean },
    applicationColorScheme: { value: string, urlSet: boolean },
    applicationTheme: { value: string, urlSet: boolean },
    applicationName: string,
    aliveInterval?: number,
    rememberMe?: boolean
}

/** Interface for whether specific buttons should be visible or not */
export type VisibleButtons = {
    reload:boolean
    rollback:boolean
    save:boolean
    home:boolean
}

/** Interface if the toolbar or the menubar should be visible or not */
export type MenuOptions = {
    toolBar:boolean
    menuBar:boolean
    userSettings:boolean
    logout:boolean
    userRestart:boolean
    foldMenuOnCollapse:boolean
}

export type AppReadyType = {
    appCSSLoaded: boolean
    schemeCSSLoaded: boolean
    themeCSSLoaded: boolean
    startupDone: boolean
    userOrLoginLoaded: boolean
    translationLoaded: boolean
}

/** The AppSettings stores settings and flags for the application */
export default class AppSettings {
    /** Contentstore instance */
    #contentStore:BaseContentStore

    /** SubscriptionManager instance */
    #subManager:SubscriptionManager

    constructor(store:BaseContentStore, subManager:SubscriptionManager) {
        this.#contentStore = store
        this.#subManager = subManager
    }

    /** Sets the ContentStore */
    setContentStore(store: BaseContentStore|ContentStore|ContentStoreFull) {
        this.#contentStore = store;
    }

    /** The logo to display when the menu is expanded */
    LOGO_BIG:string = "/assets/logo_big.png";

    /** The logo to display when the menu is collapsed */
    LOGO_SMALL:string = "/assets/logo_small.png";

    /** The logo to display at the login screen */
    LOGO_LOGIN:string = "/assets/logo_login.png";

    /** The current region */
    locale:string = "en-US";

    /** The language of the app */
    language:string = "de";

    /** The timezone of the app */
    timezone:string = "CET";

    /** The devicemode of the client */
    deviceMode:string = "desktop";

    transferType:"partial"|"full" = "partial"

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
        save: false,
        home: true
    }

    /** The menu-visibility object */
    menuOptions:MenuOptions = {
        menuBar: true,
        toolBar: true,
        userSettings: true,
        logout: true,
        userRestart: true,
        foldMenuOnCollapse: false
    }

    /** True, if change password enabled */
    changePasswordEnabled = false;

    /** The current devicestatus of the app */
    deviceStatus:DeviceStatus = "Full";

    /** True, if the menu is collapsed, default value based on window width */
    menuCollapsed:boolean = ["Small", "Mini"].indexOf(this.deviceStatus) !== -1;

    /** The welcome screen of the app */
    welcomeScreen:string = "";

    /** The desktop-panel of the app, undefined if there is no desktop-screen */
    desktopPanel:BaseComponent|undefined;

    /** An object which contains properties that indicate if the app is ready or not */
    appReadyParams:AppReadyType = { 
        appCSSLoaded: false, 
        schemeCSSLoaded: false, 
        themeCSSLoaded: false,
        startupDone: false,
        userOrLoginLoaded: false,
        translationLoaded: false
    }
    
    /** True, if the app is ready */
    appReady:boolean = false;

    /** CSS files to add when the app is ready */
    cssToAddWhenReady:Array<any> = [];

    showDebug: boolean = false;

    /**
     * Sets the menu-mode
     * @param value - the menu-mode
     */
     setMenuModeAuto(value: boolean) {
        this.menuModeAuto = value;
    }

    /** Sets if the menu is collapsed */
    setMenuCollapsed(collapsedVal:boolean) {
        this.menuCollapsed = collapsedVal;
    }

    /**
     * Sets the current login-mode
     * @param mode - the login-mode
     */
     setLoginProperties(mode:LoginModeType, errorMessage?:string) {
        this.loginMode = mode;
        if (mode === "changePassword" || mode === "changeOneTimePassword") {
            this.#subManager.emitChangePasswordVisible();
        }
        else {
            this.#subManager.emitLoginChanged(mode, errorMessage);
        }
    
    }

    /**
     * Sets the application-metadata
     * @param appMetaData - The application-metadata
     */
     setApplicationMetaData(appMetaData:ApplicationMetaDataResponse) {
        this.applicationMetaData.clientId = appMetaData.clientId;
        this.applicationMetaData.langCode = appMetaData.langCode;
        this.locale = appMetaData.langCode;
        this.applicationMetaData.languageResource = appMetaData.languageResource;
        this.applicationMetaData.lostPasswordEnabled = appMetaData.lostPasswordEnabled;
        this.applicationMetaData.preserveOnReload = appMetaData.preserveOnReload;
        this.applicationMetaData.aliveInterval = appMetaData.aliveInterval;
        this.applicationMetaData.rememberMe = appMetaData.rememberMe;

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
                addCSSDynamically('color-schemes/' + appMetaData.applicationColorScheme + '-scheme.css', "schemeCSS", () => this.setAppReadyParam("schemeCSS"));
            }
            else {
                addCSSDynamically('color-schemes/default-scheme.css', "schemeCSS", () => this.setAppReadyParam("schemeCSS"));
            }
        }
        
        if (!this.applicationMetaData.applicationTheme.urlSet) {
            if (appMetaData.applicationTheme) {
                this.applicationMetaData.applicationTheme.value = appMetaData.applicationTheme;
                addCSSDynamically('themes/' + appMetaData.applicationTheme + '.css', "themeCSS", () => this.setAppReadyParam("themeCSS"));
            }
            else {
                addCSSDynamically('themes/basti.css', "themeCSS", () => this.setAppReadyParam("themeCSS"));
            }
            this.#subManager.emitThemeChanged(appMetaData.applicationTheme);
        }
    }

    /** Sets the application-theme and that it is being set by url */
    setApplicationThemeByURL(pTheme:string) {
        this.applicationMetaData.applicationTheme = { value: pTheme, urlSet: true };
    }

    /** Sets the application-color-scheme and that it is being set by url */
    setApplicationColorSchemeByURL(pScheme:string) {
        this.applicationMetaData.applicationColorScheme = { value: pScheme, urlSet: true };
    }

    /** Sets the application-layout and that it is being set by url */
    setApplicationLayoutByURL(pLayout:"standard"|"corporation"|"modern") {
        this.applicationMetaData.applicationLayout = { layout: pLayout, urlSet: true };
    }

    /**
     * Sets the visible buttons
     * @param reload - whether the reload button is visible or not
     * @param rollback - whether the rollback button is visible or not
     * @param save - whether the save button is visible or not
     */
     setVisibleButtons(reload?:boolean, rollback?:boolean, save?:boolean, home?:boolean) {
        if (reload !== undefined) {
            this.visibleButtons.reload = reload;
        }
        
        if (rollback !== undefined) {
            this.visibleButtons.rollback = rollback;
        }
        
        if (save !== undefined) {
            this.visibleButtons.save = save;
        }

        if (home !== undefined) {
            this.visibleButtons.home = home;
        }
    }

    /**
     * Sets if change-password is enabled
     * @param cpe - changed-password enabled value
     */
    setChangePasswordEnabled(cpe?:boolean) {
        if (cpe !== undefined) {
            this.changePasswordEnabled = cpe;
        }
    }

    /**
     * Sets the menu-visibility
     * @param menuBar - True, if the menubar is visible
     * @param toolBar - True, if the toolbar is visible
     */
    setMenuOptions(menuBar?:boolean, toolBar?:boolean, userSettings?:boolean, logout?:boolean, userRestart?:boolean, foldMenuOnCollapse?:boolean) {
        if (menuBar !== undefined) {
            this.menuOptions.menuBar = menuBar;
        }

        if (toolBar !== undefined) {
            this.menuOptions.toolBar = toolBar;
        }

        if (userSettings !== undefined) {
            this.menuOptions.userSettings = userSettings
        }

        if (logout !== undefined) {
            this.menuOptions.logout = logout;
        }

        if (userRestart !== undefined) {
            this.menuOptions.userRestart = userRestart;
        }

        if (foldMenuOnCollapse !== undefined) {
            this.menuOptions.foldMenuOnCollapse = foldMenuOnCollapse;
        }
    }

    /** Sets the devicestatus */
    setDeviceStatus(deviceStatus:DeviceStatus) {
        this.deviceStatus = deviceStatus;
    }

    /** Sets the welcome-screen */
    setWelcomeScreen(welcomeScreen:string) {
        this.welcomeScreen = welcomeScreen;
    }

    /** Sets the desktop-panel */
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

    /** Sets one of the app-ready parameters, if all of the needed parameters are true, set appReady to true */
    setAppReadyParam(param:"appCSS"|"schemeCSS"|"themeCSS"|"startup"|"userOrLogin"|"translation") {
        switch (param) {
            case "appCSS":
                this.appReadyParams.appCSSLoaded = true;
                this.#subManager.notifyAppReadyParamsChange();
                break;
            case "schemeCSS":
                this.appReadyParams.schemeCSSLoaded = true;
                this.#subManager.notifyAppReadyParamsChange();
                break;
            case "themeCSS":
                this.appReadyParams.themeCSSLoaded = true;
                this.#subManager.notifyAppReadyParamsChange();
                break;
            case "startup":
                this.appReadyParams.startupDone = true;
                this.#subManager.notifyAppReadyParamsChange();
                break;
            case "userOrLogin":
                this.appReadyParams.userOrLoginLoaded = true;
                this.#subManager.notifyAppReadyParamsChange();
                break;
            case "translation":
                this.appReadyParams.translationLoaded = true;
                this.#subManager.notifyAppReadyParamsChange();
                break;
            default:
                break;
        }

        if (this.transferType === "full") {
            if (!this.appReady && this.appReadyParams.appCSSLoaded && this.appReadyParams.schemeCSSLoaded && this.appReadyParams.themeCSSLoaded && this.appReadyParams.startupDone) {
                this.cssToAddWhenReady.forEach(css => document.head.appendChild(css));
                this.appReady = true;
                this.#subManager.emitAppReady(true);
            }
        }
        else {
            if (!this.appReady && this.appReadyParams.appCSSLoaded && this.appReadyParams.schemeCSSLoaded && this.appReadyParams.themeCSSLoaded 
                && this.appReadyParams.userOrLoginLoaded && this.appReadyParams.translationLoaded) {
                    this.cssToAddWhenReady.forEach(css => document.head.appendChild(css));
                    this.appReady = true;
                    this.#subManager.emitAppReady(true);
            }
        }
    }

    /** Sets all app-ready-parameters to false */
    setAppReadyParamFalse() {
        this.appReady = false;
        this.appReadyParams = { 
            appCSSLoaded: false,
            schemeCSSLoaded: false, 
            themeCSSLoaded: false,
            startupDone: false,
            userOrLoginLoaded: false,
            translationLoaded: false
        };
    }
}