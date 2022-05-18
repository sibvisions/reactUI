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

/** Enum for ResponseNames */
enum RESPONSE_NAMES {
    APPLICATION_META_DATA="applicationMetaData",
    USER_DATA="userData",
    MENU="menu",
    SCREEN_GENERIC="screen.generic",
    CLOSE_SCREEN="closeScreen",
    LOGIN="login",
    AUTHENTICATION_DATA="authenticationData",
    UPLOAD="upload",
    DOWNLOAD="download",
    DAL_FETCH="dal.fetch",
    DAL_META_DATA="dal.metaData",
    DAL_DATA_PROVIDER_CHANGED="dal.dataProviderChanged",
    SHOW_DOCUMENT="showDocument",
    SESSION_EXPIRED="message.sessionexpired",
    ERROR="message.error",
    INFORMATION="message.information",
    DIALOG="message.dialog",
    RESTART="restart",
    APPLICATION_PARAMETERS="applicationParameters",
    LANGUAGE="language",
    APPLICATION_SETTINGS="applicationSettings",
    DEVICE_STATUS="deviceStatus",
    WELCOME_DATA="welcomeData",
    CLOSE_FRAME="closeFrame",
    CONTENT="content",
    CLOSE_CONTENT="closeContent",
    UI="UI"
}
export default RESPONSE_NAMES