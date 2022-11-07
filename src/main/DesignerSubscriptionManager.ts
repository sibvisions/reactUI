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

    /** An Array of functions which will update the button-padding of button-components */
    buttonPaddingSubscriber: Array<Function> = [];

    /** An Array of functions which will update the button-background of button-components */
    buttonBackgroundSubscriber: Array<Function> = [];

    /** An Array of functions which will update the size of checkboxes */
    checkboxSizeSubscriber: Array<Function> = [];

    /** An Array of functions which will update the size of radiobuttons */
    radiobuttonSizeSubscriber: Array<Function> = [];

    /** A function which will update the topbar (loading-bar) color */
    topbarColorSubscriber: Function = () => {};

    /**
     * @constructor constructs submanager instance
     * @param store - contentstore instance
     */
        constructor(store: BaseContentStore|ContentStore|ContentStoreFull) {
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
     * Unsubscribes a component from designer button-padding changes
     * @param fn - the function which should be unsubscribed
     */
    unsubscribeFromButtonBackground(fn:Function) {
        this.buttonBackgroundSubscriber.splice(this.buttonBackgroundSubscriber.findIndex(subFunction => subFunction === fn), 1);
    }

    /** Notifies the subscribed components that the button-padding has changed */
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
}