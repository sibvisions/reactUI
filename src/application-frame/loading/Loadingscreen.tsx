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

import React, { FC, useContext, useEffect, useMemo, useState } from "react";
import { ProgressSpinner } from 'primereact/progressspinner';
import { appContext } from "../../main/contexts/AppProvider";
import { AppReadyType } from "../../main/AppSettings";
import { concatClassnames } from "../../main/util/string-util/ConcatClassnames";

/**
 * A Component which displays a progressspinner to show that the page is currently loading
 * @returns - A Component which displays a progressspinner to show that the page is currently loading
 */
const LoadingScreen: FC = () => {
    const context = useContext(appContext);

    const paramTrans = new Map()
    .set("appCSSLoaded", "application.css")
    .set("schemeCSSLoaded", "color-scheme css")
    .set("themeCSSLoaded", "theme css")
    .set("startupDone", "startup")
    .set("translationLoaded", "translation")
    .set("userOrLoginLoaded", "user or login")

    const [appReadyParams, setAppReadyParams] = useState<AppReadyType>(context.appSettings.appReadyParams);

    const [loadImgExt, setLoadImgExt] = useState<"png"|"jpg"|"svg"|"default">("png");

    const [customSpinner, setCustomSpinner] = useState<boolean>(true);

    useEffect(() => {
        context.subscriptions.subscribeToAppReadyParams((params: AppReadyType) => setAppReadyParams({...params}));

        return () => context.subscriptions.unsubscribeFromAppParamsSubscriber()
    }, [context.subscriptions]);

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
    }, [appReadyParams])

    const loadingImage = useMemo(() => {
        switch(loadImgExt) {
            case "png":
                return <img className="loading-screen-image" alt="loading-screen-image" src={process.env.PUBLIC_URL + '/assets/loading_screen_image.' + loadImgExt} onError={() => setLoadImgExt("jpg")} />;
            case "jpg":
                return <img className="loading-screen-image" alt="loading-screen-image" src={process.env.PUBLIC_URL + '/assets/loading_screen_image.' + loadImgExt} onError={() => setLoadImgExt("svg")} />;
            case "svg":
                return <img className="loading-screen-image" alt="loading-screen-image" src={process.env.PUBLIC_URL + '/assets/loading_screen_image.' + loadImgExt} onError={() => setLoadImgExt("default")} />;
            default:
                return (
                    <svg version="1.1" id="Ebene_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
                    width="300px" height="300px" viewBox="0 0 1035 900" enableBackground="new 0 0 1035 900">
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
    }, [loadImgExt])

    const progressSpinner = useMemo(() => {
        if (customSpinner) {
            return <img className="loading-screen-spinner" src={process.env.PUBLIC_URL + '/assets/loading_screen_spinner.gif'} alt="loading-screen-spinner" onError={() => setCustomSpinner(false)} />
        }
        else {
            return (
                <ProgressSpinner className="loading-screen-spinner" strokeWidth="10px" />
            )
        }
    }, [customSpinner])

    return (
        <div className={concatClassnames(
            "loading-screen",
            context.appSettings.showDebug ? "show-debug" : "",
            loadImgExt !== "default" ? "custom-loading-image" : "")}>
            {!context.appSettings.loadingImageDisabled && loadingImage}
            {!context.appSettings.loadingSpinnerDisabled && progressSpinner}
            {context.appSettings.showDebug && <span className="loading-screen-text">{progressionText}</span>}
        </div>

    )
}
export default LoadingScreen