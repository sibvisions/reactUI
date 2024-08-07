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

import React, { FC, useState, createContext, useMemo, useEffect, useContext, useLayoutEffect, useRef } from "react";
import TopBarProgress from "react-topbar-progress-indicator";
import { appContext } from "../../contexts/AppProvider";
import getSettingsFromCSSVar from "../../util/html-util/GetSettingsFromCSSVar";

// Interface for the topbar-context
export interface TopBarContextType {
    show: Function
    hide: Function
}


// export const TopBarContext = createContext<TopBarContextType>({
//     show: () => {},
//     hide: () => {}
// });

// Counter for how many topbar request are currently ongoing
let topbarCount = 0;

/**
 * Shows the topbar and after the promises are fulfilled (topbarcount is 0), the topbar disappears
 * @param promise - the promise which is being sent
 * @param topbar - the topbar to display
 * @returns 
 */
export function showTopBar(promise: Promise<any>, topbar: TopBarContextType|undefined) {
    if (topbar) {
        topbarCount++;
        topbar.show();
        return promise.catch((err) => console.error(err)).finally(() => {
            topbarCount--;
            if (!topbarCount) {
                topbar.hide()
            }
        });
    } else {
        //console.error('topbar is undefined')
        return Promise.resolve();
    }
};

// Shows a topbar at the top of the browser when a promise is being processed.
const TopBar:FC = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** True, if the topbar is currently visible */
    const [show, setShow] = useState(false);

    /** True, if the topbar settings are allowed to be loaded */
    const [allowTopbarSettings, setAllowTopbarSettings] = useState(false);

    /** A flag to know if the topbar design was changed by the designer */
    const [designerTopbarChanged, setDesignerTopbarChanged] = useState<boolean>(false);

    /** A timeout for the medium color */
    const mediumTimeout = useRef<NodeJS.Timeout|null>(null);

    /** A timeout for the long color */
    const longTimeout = useRef<NodeJS.Timeout|null>(null);

    // Subscribes to the designer topbar color change
    useEffect(() => {
        context.designerSubscriptions.subscribeToTopbarColor(() => setDesignerTopbarChanged(prevState => !prevState))

        return () => context.designerSubscriptions.unsubscribeFromTopbarColor();
    }, [context.designerSubscriptions]);

    /** Returns which color the topbar currently displays */
    const mapBarColors = (v:string, idx:number, a:string[]) => {
        if (a.length === 1) {
            return [0, v];
        }
        return [idx / (a.length - 1), v];
    }

    // Initially loads the topbar so it exists in the dom tree and the style can be adjusted
    useLayoutEffect(() => {
            TopBarProgress.config({
                barColors: {0: "#ffffff"},
                barThickness: 0
            });
            showTopBar(new Promise((resolve) => {
                setShow(true);
                resolve({})
            }), {
                show: () => setShow(true),
                hide: () => setShow(false)
            }).then(() => {
                setShow(false);
            })
    }, [])

    // Allow topbarsettings when the app is ready, position the topbar at the bottom if needed
    useEffect(() => {
        if (context.appReady) {
            if (window.getComputedStyle(document.documentElement).getPropertyValue("--topbar-position") === "\"bottom\"") {
                const canvases = Array.from(document.getElementsByTagName("canvas"));
                canvases.forEach(canvas => {
                    if (canvas.style.zIndex === "100001") {
                        canvas.style.top = "calc(100% - " + `${window.getComputedStyle(document.documentElement).getPropertyValue('--topbar-thickness')}px`;
                    }
                });
            }
            setAllowTopbarSettings(true);
        }
    }, [context.appReady]);

    /** Loads the topbar css settings */
    const topbarSettings = useMemo(() => {
        if (allowTopbarSettings) {
            return getSettingsFromCSSVar({
                barColors: {
                    cssVar: '--topbar-colors',
                    transform: 'csv'
                },
                shadowBlur: {
                    cssVar: '--topbar-shadow-blur',
                    transform: 'float'
                },
                barThickness: {
                    cssVar: '--topbar-thickness',
                    transform: 'float'
                },
                shadowColor: '--topbar-shadow-color'
            })
        }
        else {
            return undefined;
        }
    }, [designerTopbarChanged, allowTopbarSettings]);

    /** Sets the topbar config */
    useEffect(() => {
        if (topbarSettings) {
            TopBarProgress.config({
                barColors: Object.fromEntries((topbarSettings.barColors as string[]).map((v, idx, a) => mapBarColors(v, idx, a))),
                shadowBlur: topbarSettings.shadowBlur,
                barThickness: topbarSettings.barThickness,
                shadowColor: topbarSettings.shadowColor
            });
        }
    }, [topbarSettings]);

    /** Server gets its topbar functions */
    useEffect(() => {
        context.server.topbar = {
            show: () => setShow(true),
            hide: () => setShow(false)
        }
    }, [context.server]);

    /** Starts the timeouts to change the topbars colors */
    useEffect(() => {
        if (show) {
            const colorSettings = getSettingsFromCSSVar({ 
                mediumColor: { 
                    cssVar: '--topbar-medium-interval-colors', 
                    transform: 'csv' 
                }, 
                longColor: { 
                    cssVar: '--topbar-long-interval-colors', 
                    transform: 'csv' 
                } 
            });

            // check if the css-variable has a valid number if yes and the color is set, change the config so the color of the topbar changes after a period of time
            let  mediumTimeoutInterval = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue("--topbar-medium-interval"));
            if (!isNaN(mediumTimeoutInterval) && mediumTimeoutInterval && colorSettings.mediumColor) {
                mediumTimeout.current = setTimeout(() => {
                    TopBarProgress.config({
                        barColors: Object.fromEntries((colorSettings.mediumColor as string[]).map((v, idx, a) => mapBarColors(v, idx, a))),
                        shadowBlur: topbarSettings.shadowBlur,
                        barThickness: topbarSettings.barThickness,
                        shadowColor: topbarSettings.shadowColor
                    });
                }, mediumTimeoutInterval);
            }

            let  longTimeoutInterval = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue("--topbar-long-interval"));
            if (!isNaN(longTimeoutInterval) && longTimeoutInterval && colorSettings.longColor) {
                longTimeout.current = setTimeout(() => {
                    TopBarProgress.config({
                        barColors: Object.fromEntries((colorSettings.longColor as string[]).map((v, idx, a) => mapBarColors(v, idx, a))),
                        shadowBlur: topbarSettings.shadowBlur,
                        barThickness: topbarSettings.barThickness,
                        shadowColor: topbarSettings.shadowColor
                    });
                }, longTimeoutInterval);
            }
        }
        else {
            // reset the timeouts so the topbar starts at the default color again
            if (mediumTimeout.current) {
                clearTimeout(mediumTimeout.current);
                mediumTimeout.current = null;
            }

            if (longTimeout.current) {
                clearTimeout(longTimeout.current);
                longTimeout.current = null;
            }

            if (topbarSettings) {
                TopBarProgress.config({
                    barColors: Object.fromEntries((topbarSettings.barColors as string[]).map((v, idx, a) => [idx / (a.length - 1), v])),
                    shadowBlur: topbarSettings.shadowBlur,
                    barThickness: topbarSettings.barThickness,
                    shadowColor: topbarSettings.shadowColor
                });
            }
        }
    }, [show])

    return (
        <>
            {show ? <TopBarProgress /> : null }
        </>
    )
}

export default TopBar;