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

let topbarCount = 0;

/**
 * Shows the topbar and after the promise is fulfilled, the topbar disappears
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
    }
    else {
        console.error('topbar is undefined')
        return Promise.resolve();
    }
};

// Shows a topbar at the top of the browser when a promise is being processed.
const TopBar:FC = () => {
    const context = useContext(appContext);

    const [show, setShow] = useState(false);

    const [allowTopbarSettings, setAllowTopbarSettings] = useState(false);

    const [designerTopbarChanged, setDesignerTopbarChanged] = useState<boolean>(false);

    const mediumTimeout = useRef<NodeJS.Timeout|null>(null);

    const longTimeout = useRef<NodeJS.Timeout|null>(null);

    useEffect(() => {
        context.designerSubscriptions.subscribeToTopbarColor(() => setDesignerTopbarChanged(prevState => !prevState))

        return () => context.designerSubscriptions.unsubscribeFromTopbarColor();
    }, [context.designerSubscriptions]);

    const mapBarColors = (v:string, idx:number, a:string[]) => {
        if (a.length === 1) {
            return [0, v];
        }
        return [idx / (a.length - 1), v];
    }

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

    useEffect(() => {
        context.server.topbar = {
            show: () => setShow(true),
            hide: () => setShow(false)
        }
    }, [context.server]);

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