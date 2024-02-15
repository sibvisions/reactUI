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

import BaseContentStore from "./contentstore/BaseContentStore";
import ContentStore from "./contentstore/ContentStore";
import ContentStoreFull from "./contentstore/ContentStoreFull";

/** Manages designer subscriptions and handles the subscriber events */
export class DesignerSubscriptionManager {
    /** Contentstore instance */
    contentStore: BaseContentStore|ContentStore|ContentStoreFull;

    /** An Array of functions which will update the font-size of a component */
    fontSizeSubscriber: Array<Function> = [];

    /** An Array of functions which will update the size of the screen, when the header size changes */
    stdHeaderSubscriber: Array<Function> = [];

    /** An Array of functions which will update the size of the menu size changes  */
    stdMenuWidthSubscriber: Array<Function> = [];

    /** An Array of functions which will update the size of the collapsed menu size changes  */
    stdMenuCollapsedWidthSubscriber: Array<Function> = [];

    /** An Array of functions which will update the size of the screen, when the corp header size changes */
    corpHeaderSubscriber: Array<Function> = [];

    /** An Array of functions which will update the size of the screen, when the corp menubar size changes */
    corpMenubarSubscriber: Array<Function> = [];

    /** An Array of functions which will update the button-padding of button-components */
    buttonPaddingSubscriber: Array<Function> = [];

    /** An Array of functions which will update the button-padding of icon-only button-components */
    buttonIconOnlyPaddingSubscriber: Array<Function> = [];

    /** An Array of functions which will update the button-padding of date/linked editor buttons */
    inputButtonPaddingSubscriber: Array<Function> = [];

    /** An Array of functions which will update the button-background of button-components */
    buttonBackgroundSubscriber: Array<Function> = [];

    /** An Array of functions which will update the size of checkboxes */
    checkboxSizeSubscriber: Array<Function> = [];

    /** An Array of functions which will update the size of radiobuttons */
    radiobuttonSizeSubscriber: Array<Function> = [];

    /** An Array of functions which will update the padding of menubuttons */
    menubuttonPaddingSubscriber: Array<Function> = [];

    /** An Array of functions which will update the left-right-padding of inputfields */
    inputLRPaddingSubscriber: Array<Function> = [];

    /** An Array of functions which will update the top-bottom-padding of inputfields */
    inputTBPaddingSubscriber: Array<Function> = [];

    /** An Array of functions which will update the padding of tabset navbars */
    tabPaddingSubscriber: Array<Function> = [];

    /** An Array of functions which will update the padding of table's header */
    tableHeaderPaddingSubscriber: Array<Function> = [];

    /** An Array of functions which will update the height of table-rows */
    tableDataHeightSubscriber: Array<Function> = [];

    /** An Array of functions which will update the height of menubars (v2) */
    menuBarHeightSubscriber: Array<Function> = [];

    /** A function which will update the topbar (loading-bar) color */
    topbarColorSubscriber: Function = () => {};

    /**
     * @constructor constructs submanager instance
     * @param store - contentstore instance
     */
        constructor(store: BaseContentStore|ContentStore|ContentStoreFull) {
        this.contentStore = store;
    }

    /** Sets the ContentStore */
    setContentStore(store: BaseContentStore|ContentStore|ContentStoreFull) {
        this.contentStore = store;
    }

    /**
     * Subscribes a component to designer font-size changes
     * @param fn - the function to update the state
     */
    subscribeToFontSize(fn:Function) {
        this.fontSizeSubscriber.push(fn);
    }

    /** 
     * Unsubscribes a component from designer font-size changes
     * @param fn - the function which should be unsubscribed
     */
    unsubscribeFromFontSize(fn:Function) {
        this.fontSizeSubscriber.splice(this.fontSizeSubscriber.findIndex(subFunction => subFunction === fn), 1);
    }

    /** Notifies the subscribed components that the font-size has changed */
    notifyFontSizeChanged() {
        this.fontSizeSubscriber.forEach(subFunction => subFunction.apply(undefined, []));
    }

    /**
     * Subscribes a component to designer standard-menu-header changes
     * @param fn - the function to update the state
     */
     subscribeToStdHeader(fn: Function) {
        this.stdHeaderSubscriber.push(fn);
    }

    /** 
     * Unsubscribes a component from designer standard-menu-header changes
     * @param fn - the function which should be unsubscribed
     */
    unsubscribeFromStdHeader(fn: Function) {
        this.stdHeaderSubscriber.splice(this.stdHeaderSubscriber.findIndex(subFunction => subFunction === fn), 1);
    }

    /** Notifies the subscribed components that the standard-menu-header has changed */
    notifyStdHeaderChanged() {
        this.stdHeaderSubscriber.forEach(subFunction => subFunction.apply(undefined, []));
    }

    /**
     * Subscribes a component to designer standard-menu-width changes
     * @param fn - the function to update the state
     */
     subscribeToStdMenuWidth(fn: Function) {
        this.stdMenuWidthSubscriber.push(fn);
    }

    /** 
     * Unsubscribes a component from designer standard-menu-width changes
     * @param fn - the function which should be unsubscribed
     */
    unsubscribeFromStdMenuWidth(fn: Function) {
        this.stdMenuWidthSubscriber.splice(this.stdMenuWidthSubscriber.findIndex(subFunction => subFunction === fn), 1);
    }

    /** Notifies the subscribed components that the standard-menu-width has changed */
    notifyStdMenuWidthChanged() {
        this.stdMenuWidthSubscriber.forEach(subFunction => subFunction.apply(undefined, []));
    }

    /**
     * Subscribes a component to designer standard-menu-collpased-width changes
     * @param fn - the function to update the state
     */
     subscribeToStdMenuCollapsedWidth(fn: Function) {
        this.stdMenuCollapsedWidthSubscriber.push(fn);
    }

    /** 
     * Unsubscribes a component from designer standard-menu-collpased-width changes
     * @param fn - the function which should be unsubscribed
     */
    unsubscribeFromStdMenuCollapsedWidth(fn: Function) {
        this.stdMenuCollapsedWidthSubscriber.splice(this.stdMenuCollapsedWidthSubscriber.findIndex(subFunction => subFunction === fn), 1);
    }

    /** Notifies the subscribed components that the standard-menu-collpased-width has changed */
    notifyStdMenuCollapsedWidthChanged() {
        this.stdMenuCollapsedWidthSubscriber.forEach(subFunction => subFunction.apply(undefined, []));
    }

    /**
     * Subscribes a component to designer corporation-menu-header changes
     * @param fn - the function to update the state
     */
     subscribeToCorpHeader(fn: Function) {
        this.corpHeaderSubscriber.push(fn);
    }

    /** 
     * Unsubscribes a component from designer corporation-menu-header changes
     * @param fn - the function which should be unsubscribed
     */
    unsubscribeFromCorpHeader(fn: Function) {
        this.corpHeaderSubscriber.splice(this.corpHeaderSubscriber.findIndex(subFunction => subFunction === fn), 1);
    }

    /** Notifies the subscribed components that the corporation-menu-header has changed */
    notifyCorpHeaderChanged() {
        this.corpHeaderSubscriber.forEach(subFunction => subFunction.apply(undefined, []));
    }

    /**
     * Subscribes a component to designer corporation-menubar changes
     * @param fn - the function to update the state
     */
     subscribeToCorpMenubar(fn: Function) {
        this.corpMenubarSubscriber.push(fn);
    }

    /** 
     * Unsubscribes a component from designer corporation-menubar changes
     * @param fn - the function which should be unsubscribed
     */
    unsubscribeFromCorpMenubar(fn: Function) {
        this.corpMenubarSubscriber.splice(this.corpMenubarSubscriber.findIndex(subFunction => subFunction === fn), 1);
    }

    /** Notifies the subscribed components that the corporation-menubar has changed */
    notifyCorpMenubarChanged() {
        this.corpMenubarSubscriber.forEach(subFunction => subFunction.apply(undefined, []));
    }

    /**
     * Subscribes a component to designer button-padding changes
     * @param fn - the function to update the state
     */
     subscribeToButtonPadding(fn:Function) {
        this.buttonPaddingSubscriber.push(fn);
    }

    /** 
     * Unsubscribes a component from designer button-padding changes
     * @param fn - the function which should be unsubscribed
     */
    unsubscribeFromButtonPadding(fn:Function) {
        this.buttonPaddingSubscriber.splice(this.buttonPaddingSubscriber.findIndex(subFunction => subFunction === fn), 1);
    }

    /** Notifies the subscribed components that the button-padding has changed */
    notifyButtonPaddingChanged() {
        this.buttonPaddingSubscriber.forEach(subFunction => subFunction.apply(undefined, []));
    }

    /**
     * Subscribes a component to designer button-background changes
     * @param fn - the function to update the state
     */
    subscribeToButtonBackground(fn:Function) {
        this.buttonBackgroundSubscriber.push(fn);
    }

    /** 
     * Unsubscribes a component from designer button-background changes
     * @param fn - the function which should be unsubscribed
     */
    unsubscribeFromButtonBackground(fn:Function) {
        this.buttonBackgroundSubscriber.splice(this.buttonBackgroundSubscriber.findIndex(subFunction => subFunction === fn), 1);
    }

    /** Notifies the subscribed components that the button-background has changed */
    notifyButtonBackgroundChanged() {
        this.buttonBackgroundSubscriber.forEach(subFunction => subFunction.apply(undefined, []));
    }

    /**
     * Subscribes the topbar component to designer changes
     * @param fn 
     */
    subscribeToTopbarColor(fn: Function) {
        this.topbarColorSubscriber = fn;
    }

    /** Unsubscribes the topbar component from designer changes */
    unsubscribeFromTopbarColor() {
        this.topbarColorSubscriber = () => {};
    }

    /** Notifies the topbar that it's colors changed */
    notifyTopbarColorChanged() {
        this.topbarColorSubscriber.apply(undefined, []);
    }

    /**
     * Subscribes a component to designer checkbox-size changes
     * @param fn - the function to update the state
     */
    subscribeToCheckboxSize(fn: Function) {
        this.checkboxSizeSubscriber.push(fn);
    }

    /**
     * Unsubscribes the component from designer checkbox-size changes
     * @param fn - the function to update the state
     */
    unsubscribeFromCheckboxSize(fn: Function) {
        this.checkboxSizeSubscriber.splice(this.checkboxSizeSubscriber.findIndex(subFunction => subFunction === fn), 1)
    }

    /** Notifies the components that the checkbox-size changed */
    notifyCheckboxSizeChanged() {
        this.checkboxSizeSubscriber.forEach(subFunction => subFunction.apply(undefined, []));
    }

    /**
     * Subscribes a component to designer radiobutton-size changes
     * @param fn - the function to update the state
     */
    subscribeToRadiobuttonSize(fn: Function) {
        this.radiobuttonSizeSubscriber.push(fn);
    }

    /**
     * Unsubscribes the component from designer radiobutton-size changes
     * @param fn - the function to update the state
     */
    unsubscribeFromRadiobuttonSize(fn: Function) {
        this.radiobuttonSizeSubscriber.splice(this.radiobuttonSizeSubscriber.findIndex(subFunction => subFunction === fn), 1)
    }

    /** Notifies the components that the radiobutton-size changed */
    notifyRadiobuttonSizeChanged() {
        this.radiobuttonSizeSubscriber.forEach(subFunction => subFunction.apply(undefined, []))
    }

    /**
     * Subscribes a component to designer icon-only button-padding changes
     * @param fn - the function to update the state
     */
     subscribeToIconOnlyPadding(fn: Function) {
        this.buttonIconOnlyPaddingSubscriber.push(fn);
    }

    /**
     * Unsubscribes the component from designer icon-only button-padding changes
     * @param fn - the function to update the state
     */
    unsubscribeFromIconOnlyPadding(fn: Function) {
        this.buttonIconOnlyPaddingSubscriber.splice(this.buttonIconOnlyPaddingSubscriber.findIndex(subFunction => subFunction === fn), 1)
    }

    /** Notifies the components that the icon-only button-padding changed */
    notifyIconOnlyPaddingChanged() {
        this.buttonIconOnlyPaddingSubscriber.forEach(subFunction => subFunction.apply(undefined, []))
    }
    
    /**
     * Subscribes a component to designer input button-padding changes
     * @param fn - the function to update the state
     */
     subscribeToInputButtonPadding(fn: Function) {
        this.inputButtonPaddingSubscriber.push(fn);
    }

    /**
     * Unsubscribes the component from designer input button-padding changes
     * @param fn - the function to update the state
     */
    unsubscribeFromInputButtonPadding(fn: Function) {
        this.inputButtonPaddingSubscriber.splice(this.inputButtonPaddingSubscriber.findIndex(subFunction => subFunction === fn), 1)
    }

    /** Notifies the components that the input button-padding changed */
    notifyInputButtonPaddingChanged() {
        this.inputButtonPaddingSubscriber.forEach(subFunction => subFunction.apply(undefined, []))
    }

    /**
     * Subscribes a component to designer menu-button-padding changes
     * @param fn - the function to update the state
     */
     subscribeToMenuButtonPadding(fn: Function) {
        this.menubuttonPaddingSubscriber.push(fn);
    }

    /**
     * Unsubscribes the component from designer menu-button-padding changes
     * @param fn - the function to update the state
     */
    unsubscribeFromMenuButtonPadding(fn: Function) {
        this.menubuttonPaddingSubscriber.splice(this.menubuttonPaddingSubscriber.findIndex(subFunction => subFunction === fn), 1)
    }

    /** Notifies the components that the menu-button-padding changed */
    notifyMenuButtonPaddingChanged() {
        this.menubuttonPaddingSubscriber.forEach(subFunction => subFunction.apply(undefined, []))
    }

    /**
     * Subscribes a component to designer input-padding left-right changes
     * @param fn - the function to update the state
     */
     subscribeToInputLRPadding(fn: Function) {
        this.inputLRPaddingSubscriber.push(fn);
    }

    /**
     * Unsubscribes the component from designer input-padding left-right changes
     * @param fn - the function to update the state
     */
    unsubscribeFromInputLRPadding(fn: Function) {
        this.inputLRPaddingSubscriber.splice(this.inputLRPaddingSubscriber.findIndex(subFunction => subFunction === fn), 1)
    }

    /** Notifies the components that the input-padding left-right changed */
    notifyInputLRPaddingChanged() {
        this.inputLRPaddingSubscriber.forEach(subFunction => subFunction.apply(undefined, []))
    }

    /**
     * Subscribes a component to designer input-padding top-bottom changes
     * @param fn - the function to update the state
     */
     subscribeToInputTBPadding(fn: Function) {
        this.inputTBPaddingSubscriber.push(fn);
    }

    /**
     * Unsubscribes the component from designer input-padding top-bottom changes
     * @param fn - the function to update the state
     */
    unsubscribeFromInputTBPadding(fn: Function) {
        this.inputTBPaddingSubscriber.splice(this.inputTBPaddingSubscriber.findIndex(subFunction => subFunction === fn), 1)
    }

    /** Notifies the components that the input-padding top-bottom changed */
    notifyInputTBPaddingChanged() {
        this.inputTBPaddingSubscriber.forEach(subFunction => subFunction.apply(undefined, []))
    }

    /**
     * Subscribes a component to designer tab-padding changes
     * @param fn - the function to update the state
     */
     subscribeToTabPadding(fn: Function) {
        this.tabPaddingSubscriber.push(fn);
    }

    /**
     * Unsubscribes the component from designer tab-padding changes
     * @param fn - the function to update the state
     */
    unsubscribeFromTabPadding(fn: Function) {
        this.tabPaddingSubscriber.splice(this.tabPaddingSubscriber.findIndex(subFunction => subFunction === fn), 1)
    }

    /** Notifies the components that the tab-padding changed */
    notifyTabPaddingChanged() {
        this.tabPaddingSubscriber.forEach(subFunction => subFunction.apply(undefined, []))
    }

    /**
     * Subscribes a component to designer table-header-padding changes
     * @param fn - the function to update the state
     */
     subscribeToTableHeaderPadding(fn: Function) {
        this.tableHeaderPaddingSubscriber.push(fn);
    }

    /**
     * Unsubscribes the component from designer table-header-padding changes
     * @param fn - the function to update the state
     */
    unsubscribeFromTableHeaderPadding(fn: Function) {
        this.tableHeaderPaddingSubscriber.splice(this.tableHeaderPaddingSubscriber.findIndex(subFunction => subFunction === fn), 1)
    }

    /** Notifies the components that the table-header-padding changed */
    notifyTableHeaderPaddingChanged() {
        this.tableHeaderPaddingSubscriber.forEach(subFunction => subFunction.apply(undefined, []))
    }

    /**
     * Subscribes a component to designer table-data-height changes
     * @param fn - the function to update the state
     */
     subscribeToTableDataHeight(fn: Function) {
        this.tableDataHeightSubscriber.push(fn);
    }

    /**
     * Unsubscribes the component from designer table-data-height changes
     * @param fn - the function to update the state
     */
    unsubscribeFromTableDataHeight(fn: Function) {
        this.tableDataHeightSubscriber.splice(this.tableDataHeightSubscriber.findIndex(subFunction => subFunction === fn), 1)
    }

    /** Notifies the components that the table-data-height changed */
    notifyTableDataHeightChanged() {
        this.tableDataHeightSubscriber.forEach(subFunction => subFunction.apply(undefined, []))
    }

    /**
     * Subscribes a component to designer menubar-height changes
     * @param fn - the function to update the state
     */
     subscribeToMenuBarHeight(fn: Function) {
        this.menuBarHeightSubscriber.push(fn);
    }

    /**
     * Unsubscribes the component from designer menubar-height changes
     * @param fn - the function to update the state
     */
    unsubscribeFromMenuBarHeight(fn: Function) {
        this.menuBarHeightSubscriber.splice(this.menuBarHeightSubscriber.findIndex(subFunction => subFunction === fn), 1)
    }

    /** Notifies the components that the menubar-height changed */
    notifyMenuBarHeightChanged() {
        this.menuBarHeightSubscriber.forEach(subFunction => subFunction.apply(undefined, []))
    }

    /** Notifies all subscribers of all properties, that there have been changes, incase of reset */
    notifyAll() {
        this.notifyButtonBackgroundChanged();
        this.notifyButtonPaddingChanged();
        this.notifyCheckboxSizeChanged();
        this.notifyCorpHeaderChanged();
        this.notifyCorpMenubarChanged();
        this.notifyFontSizeChanged();
        this.notifyIconOnlyPaddingChanged();
        this.notifyInputButtonPaddingChanged();
        this.notifyInputLRPaddingChanged();
        this.notifyInputTBPaddingChanged();
        this.notifyMenuBarHeightChanged();
        this.notifyMenuButtonPaddingChanged();
        this.notifyRadiobuttonSizeChanged();
        this.notifyStdHeaderChanged();
        this.notifyStdMenuCollapsedWidthChanged();
        this.notifyStdMenuWidthChanged();
        this.notifyTabPaddingChanged();
        this.notifyTableDataHeightChanged();
        this.notifyTableHeaderPaddingChanged();
        this.notifyTopbarColorChanged();
    }
}