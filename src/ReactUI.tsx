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

import React, { FC, useContext, useLayoutEffect } from 'react';
import PrimeReact, { addLocale, locale } from 'primereact/api';
import { Route, Switch } from "react-router-dom";
import UIManager from './application-frame/screen-management/ui-manager/UIManager';
import LoadingScreen from './application-frame/loading/Loadingscreen';
import type { ICustomContent } from "./MiddleMan";
import AppWrapper from './AppWrapper';
import UIManagerFull from './application-frame/screen-management/ui-manager/UIManagerFull';
import { appContext } from './main/contexts/AppProvider';
import Login from './application-frame/login/Login';


/**
 * This component manages the start and routing of the application.
 * @param props - Custom content, which a user can define when using reactUI as library e.g CustomScreens, CustomComponents, ReplaceScreen
 */
const ReactUI: FC<ICustomContent> = (props) => {
    const context = useContext(appContext);

    useLayoutEffect(() => {
        addLocale('de', {
            accept: 'Ja',
            reject: 'Nein',
            choose: 'Auswählen',
            upload: 'Hochladen',
            cancel: 'Abbrechen',
            dayNames: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
            dayNamesShort: ['Son', 'Mon', 'Die', 'Mit', 'Don', 'Fre', 'Sam'],
            dayNamesMin: ['So','Mo','Di','Mi','Do','Fr','Sa'],
            monthNames: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
            monthNamesShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun','Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
            today: 'Heute',
            clear: 'Löschen',
            weekHeader: 'Wo',
            firstDayOfWeek: 1,
            dateFormat: 'dd.mm.yyyy',
            weak: 'Schwach',
            medium: 'Mittel',
            strong: 'Stark',
            passwordPrompt: 'Passwort eingeben'
         });
    }, [])

    /** PrimeReact ripple effect */
    PrimeReact.ripple = true;
  
    /** When the app isn't ready, show the loadingscreen, if it is show normal */
    if (context.transferType === "full") {
        return (
            <AppWrapper>
                {context.appReady ?
                    <Switch>
                        <Route path={""} render={() => <UIManagerFull />} />
                    </Switch>
                    :
                    <LoadingScreen />
                }
            </AppWrapper>
        )
    }
    else {
        return (
            <AppWrapper>
                {context.appReady ?
                    <Switch>
                            <Route exact path={"/login"} render={() => <Login />} />
                            <Route exact path={"/home/:componentId"} render={() => <UIManager customAppWrapper={props.customAppWrapper} />} />
                            <Route path={"/home"} render={() => <UIManager customAppWrapper={props.customAppWrapper} />} />
                    </Switch>
                    :
                    <LoadingScreen />
                }
            </AppWrapper>
        );
    }

}
export default ReactUI;
