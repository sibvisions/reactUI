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

import React, { CSSProperties, FC, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ProgressSpinner } from 'primereact/progressspinner';
import { appContext } from "../../main/contexts/AppProvider";
import { AppReadyType } from "../../main/AppSettings";
import { concatClassnames } from "../../main/util/string-util/ConcatClassnames";

/**
 * A Component which displays a progressspinner to show that the page is currently loading
 * @returns - A Component which displays a progressspinner to show that the page is currently loading
 */
const LoadingScreen: FC = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Map of parameters as keys and text to display which still need to be loaded */
    const paramTrans = new Map()
    .set("appCSSLoaded", "application.css")
    .set("schemeCSSLoaded", "color-scheme css")
    .set("themeCSSLoaded", "theme css")
    .set("startupDone", "startup")
    .set("translationLoaded", "translation")
    .set("userOrLoginLoaded", "user or login")

    /** The current state which app-ready params are ready */
    const [appReadyParams, setAppReadyParams] = useState<AppReadyType>(context.appSettings.appReadyParams);

    /** The element which is used for a custom loading screen, is used to extract all the custom-attributes */
    const loadingElem = document.getElementById("custom-loading-screen");

    /** Subscribes to the app-ready parameters and updates the state */
    useEffect(() => {
        context.subscriptions.subscribeToAppReadyParams((params: AppReadyType) => setAppReadyParams({...params}));

        return () => context.subscriptions.unsubscribeFromAppParamsSubscriber()
    }, [context.subscriptions]);

    /** The progression-text to know which parameters are still being loaded */
    const progressionText = useMemo(() => {
        if (Object.values(appReadyParams).every(v => v === true)) {
            return "Done"
        }
        else {
            return Object.entries(appReadyParams).reduce((x, y) => {
                if (!y[1]) {
                    if (x === "Loading: ") {
                        return x + paramTrans.get(y[0]);
                    }
                    else {
                        return x + ", " + paramTrans.get(y[0]);
                    }   
                }
                else {
                    return x;
                }
            }, "Loading: ")
        }
    }, [appReadyParams]);

    /** True if there is a custom-loading-image to display */
    const hasCustomImage = loadingElem?.getAttribute("loading-image") && loadingElem.getAttribute("loading-image-disabled") !== "true";

    /** True if there is a custom-loading-spinner to display */
    const hasCustomSpinner = loadingElem?.getAttribute("loading-spinner") && loadingElem.getAttribute("loading-spinner-disabled") !== "true";

    /** The order in which to show the loading elements */
    const elementOrder = loadingElem?.getAttribute("loading-order") ? loadingElem.getAttribute("loading-order")!.split(" ") : ["image", "spinner", "text"];

    /**
     * Returns the position of the loading elements in flex-terms
     * @param type - the type of the element
     */
    const getLoadingPosition = (type: "image"|"spinner"|"text") => {
        // Translates position to flex terms, checks keywords, if wrong keyword default is center
        const positionConverter = (position: string) => {
            switch (position) {
                case "top": case "left":
                    return "flex-start";
                case "center":
                    return "center";
                case "bottom": case "right":
                    return "flex-end";
                default:
                    return "center";
            }
        }

        const attribute = type === "image" ? "loading-image-position" : type === "spinner" ? "loading-spinner-position" : "loading-text-position";

        if (loadingElem && loadingElem.getAttribute(attribute)) {
            const splitPosString = (loadingElem.getAttribute(attribute) as string).split(" ");
            // If there are two terms use the first one as vertical and the second as horizontal
            if (splitPosString.length === 2) {
                return { vertical: positionConverter(splitPosString[0]), horizontal: positionConverter(splitPosString[1]) };
            }
            // If there is only one term specified, make the second one 'center'
            else if (splitPosString.length === 1) {
                // Check for keywords, default is center, center
                switch (splitPosString[0]) {
                    case "left": case "right":
                        return { vertical: "center", horizontal: positionConverter(splitPosString[0]) };
                    case "top": case "bottom":
                        return { vertical: positionConverter(splitPosString[0]), horizontal: "center" };
                    default:
                        return { vertical: "center", horizontal: "center" }
                }
            }
        }
        return { vertical: "center", horizontal: "center" }
    }

    /** The position of the image-element */
    const imagePosition = getLoadingPosition("image");

    /** The position of the spinner-element */
    const spinnerPosition = getLoadingPosition("spinner");

    /** The position of the text-element */
    const textPosition = getLoadingPosition("text");

    /**
     * Returns true, if the first and second position are the same.
     * @param pos1 the position of the first element
     * @param pos2 the position of the second element
     */
    const isSamePosition = (pos1: { vertical: string, horizontal: string }, pos2: { vertical: string, horizontal: string }) => {
        return pos1.vertical === pos2.vertical && pos1.horizontal === pos2.horizontal;
    }

    /** True if the spinner is in the image */
    const spinnerInImage = !hasCustomImage && isSamePosition(imagePosition, spinnerPosition);

    /** Returns an array of the elements with the same position in the correct display order. Empty if there are no elements with same position */
    const getElemsWithSamePosition = () => {
        const samePosArray = [];
        if (isSamePosition(imagePosition, spinnerPosition)) {
            // FindIndex checks for correct order and pushes them to the array
            if (elementOrder.findIndex(val => val === "image") < elementOrder.findIndex(val => val === "spinner")) {
                samePosArray.push("image");
                samePosArray.push("spinner");
            }
            else {
                samePosArray.push("spinner");
                samePosArray.push("image");
            }

            if (isSamePosition(imagePosition, textPosition)) {
                samePosArray.splice(elementOrder.findIndex(val => val === "text"), 0, "text")
            }
        }
        else {
            if (isSamePosition(imagePosition, textPosition)) {
                if (elementOrder.findIndex(val => val === "image") < elementOrder.findIndex(val => val === "text")) {
                    samePosArray.push("image");
                    samePosArray.push("text");
                }
                else {
                    samePosArray.push("text");
                    samePosArray.push("image");
                }
            }
            else if (isSamePosition(spinnerPosition, textPosition)) {
                if (elementOrder.findIndex(val => val === "spinner") < elementOrder.findIndex(val => val === "text")) {
                    samePosArray.push("spinner");
                    samePosArray.push("text");
                }
                else {
                    samePosArray.push("text");
                    samePosArray.push("spinner");
                }
            }
        }
        return samePosArray;
    }

    const samePosArray = getElemsWithSamePosition();

    /**
     * Returns the style of the given element based on its position and if there are style attributes set for this element in the index.html
     * @param type - the type of the element
     */
    const getLoadingElemStyle = (type: "background"|"image"|"spinner"|"text") => {
        const style:CSSProperties = {}
        style.order = elementOrder.findIndex(val => val === type).toString();
        if (!samePosArray.includes(type) && type !== "background") {
            style.position = "absolute";
            const position = getLoadingPosition(type);

            if (position.horizontal === "flex-start") {
                style.left = "0";
            }
            else if (position.horizontal === "flex-end") {
                style.right = "0";
            }

            if (position.vertical === "flex-start") {
                style.top = "0";
            }
            else if (position.vertical === "flex-end") {
                style.bottom = "0";
            }

            if (position.horizontal === "center" && position.vertical === "center") {
                style.top = "50%";
                style.left = "50%";
                style.transform = "translate(-50%, -50%)";
            }
            else if (position.horizontal === "center" && position.vertical !== "center") {
                style.left = "50%";
                style.transform = "translateX(-50%)";
            }
            else if (position.horizontal !== "center" && position.vertical === "center") {
                style.top = "50%";
                style.transform = "translateY(-50%)";
            }
        }

        const attributeName = "loading-" + type + "-style";

        /**
         * Returns the style string as object. First tries to parse the string as JSON, if it isn't a correct json string, it is returned as background
         * @param style - the style string
         */
        const parseStyleString = (style: string) => {
            try {
                const customStyleObject = JSON.parse(style);
                return customStyleObject;
            }
            catch {
                return { background: style };
            }
        }

        if (loadingElem?.getAttribute(attributeName)) {
            const styleString = loadingElem.getAttribute(attributeName);
            if (typeof styleString === "string") {
                if (type === "background") {
                    return {
                        ...parseStyleString(styleString),
                        "--justifyContainer": samePosArray.length ? getLoadingPosition(samePosArray[0] as "image" | "spinner" | "text").vertical : 'center',
                        "--alignContainer": samePosArray.length ? getLoadingPosition(samePosArray[0] as "image" | "spinner" | "text").horizontal : 'center'
                    } as CSSProperties;
                }
                else {
                    return {...style, ...parseStyleString(styleString)}
                }
            }
        }

        return style;
    }

    // Sets spinner position
    useLayoutEffect(() => {
        if (document.getElementById("loading-screen-text") 
            && document.getElementById("loading-screen-spinner")
            && spinnerInImage) {
                if (samePosArray.findIndex(val => val === "spinner") > samePosArray.findIndex(val => val === "text")) {
                    document.getElementById("loading-screen-spinner")!.style.top = "calc(50% - 10px + " + `${document.getElementById("loading-screen-text")!.offsetHeight / 2}px` + ")"
                }
                else {
                    document.getElementById("loading-screen-spinner")!.style.top = "calc(50% - 18px - " + `${document.getElementById("loading-screen-text")!.offsetHeight / 2}px` + ")"
                }
        }
    }, [])

    /** Returns either the custom set image or the default image */
    const loadingImage = useMemo(() => {
        if (!loadingElem || (loadingElem && loadingElem.getAttribute("loading-image-disabled") !== 'true')) {
            if (hasCustomImage) {
                return <img 
                            className="loading-screen-image" 
                            alt="loading-screen-image" 
                            key="loading-screen-image" 
                            src={"./" + loadingElem!.getAttribute("loading-image")}
                            style={getLoadingElemStyle("image")} />;
            }
            else {
                return (
                    <svg version="1.1" id="Ebene_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
                    width="300px" height="300px" viewBox="0 0 1035 900" enableBackground="new 0 0 1035 900" style={getLoadingElemStyle("image")}>
                    <g>
                        <path fill="#069339" d="M490.288,477.792c15.104-15.091,39.598-15.091,54.707,0c15.105,15.097,15.105,39.565,0,54.657
                                        c-15.108,15.091-39.601,15.097-54.707,0C475.179,517.354,475.182,492.889,490.288,477.792z"/>
                        <path fill="#0C3857" d="M324.186,505.13c0.288-52.192,23.64-99.193,60.882-132.396l-77.365-77.31
                                        c-53.913,53.624-87.354,127.761-87.62,209.706H324.186z"/>
                        <path fill="#B2B2B2" d="M324.16,506.102c0-0.324,0.023-0.646,0.026-0.972H220.083c0,0.324-0.011,0.646-0.011,0.972
                                        c0,81.84,33.107,155.95,86.664,209.711l77.324-77.256C347.175,605.198,324.16,558.209,324.16,506.102z"/>
                        <g>
                            <path fill="#EF7E08" d="M711.094,505.125c0,0.327,0.028,0.648,0.028,0.977c0,101.174-86.627,183.192-193.482,183.192
                                            c-51.819,0-98.847-19.33-133.58-50.739l-77.324,77.258c53.888,54.088,128.48,87.574,210.904,87.574
                                            c164.349,0,297.569-133.101,297.569-297.285c0-0.326-0.012-0.647-0.012-0.973L711.094,505.125z"/>
                        </g>
                        <rect x="711.094" y="99" fill="#069339" width="104.104" height="406.13" />
                    </g>
                </svg>
                )
            }
        }

    }, [hasCustomImage])

    /** Returns either the custom set spinner or the default spinner */
    const progressSpinner = useMemo(() => {
        if (!loadingElem || (loadingElem && loadingElem.getAttribute("loading-spinner-disabled") !== 'true')) {
            if (hasCustomSpinner) {
                return <img 
                            id="loading-screen-spinner" 
                            alt="loading-screen-spinner" 
                            key="loading-screen-spinner" 
                            src={"./" + loadingElem!.getAttribute("loading-spinner")}
                            style={getLoadingElemStyle("spinner")} />
            }
            else {
                return (
                    <ProgressSpinner id="loading-screen-spinner" strokeWidth="10px" style={getLoadingElemStyle("spinner")} />
                )
            }
        }
    }, [hasCustomSpinner]);

    /** Returns the loading-text if it is set */
    const loadingText = loadingElem?.getAttribute("loading-text") ? <span id="loading-screen-text" key={loadingElem.getAttribute("loading-text")} style={getLoadingElemStyle("text")} >{loadingElem.getAttribute("loading-text")}</span> : undefined;

    /** True, if there is a loading-html-set */
    const hasLoadingHTML = loadingElem?.getAttribute("loading-html") ? true : false;

    // If there is a loading-html display it else the loading-screen
    return (
        <>
            {!hasLoadingHTML ? <div
                className={concatClassnames(
                    "loading-screen",
                    context.appSettings.showDebug ? "show-debug" : "",
                    spinnerInImage ? "default-loading-container" : "")}
                style={getLoadingElemStyle("background")}>
                <div className="loading-elements-wrapper">
                    {loadingImage}
                    {progressSpinner}
                    {loadingText}
                </div>
                {context.appSettings.showDebug && <span className="loading-screen-progress-text">{progressionText}</span>}
            </div> 
            : 
            <iframe className="html-loading-screen" src={"./" + loadingElem!.getAttribute("loading-html")} />}
        </>
    )
}
export default LoadingScreen