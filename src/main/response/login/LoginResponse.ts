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

import BaseResponse from "../BaseResponse"

/** Type for the different login modes */
export type LoginModeType = "manual"|"changePassword"|"changeOneTimePassword"|"automatic"|"lostPassword"|"mFTextInput"|"mFWait"|"mFURL"|undefined

// Type for the url link object sent by the server
export type MFAURLType = {
    target?: "_self" | "_blank",
    url: string
    height?: number,
    width?: number,
}

/** Interface for LoginResponse */
interface LoginResponse extends BaseResponse {
    username: string;
    mode: LoginModeType;
    confirmationCode?: string;
    link?:string | MFAURLType;
    timeout?:number;
    timeoutReset?:boolean
    errorMessage?: string
}
export default LoginResponse;