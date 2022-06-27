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

import BaseComponent from "../../util/types/BaseComponent";

/** Interface for Buttons contains properties which are sent by the server */
export interface IButton extends BaseComponent {
    accelerator: string,
    horizontalTextPosition?:number,
    verticalTextPosition?:number,
    borderPainted?: boolean,
    imageTextGap?: number,
    borderOnMouseEntered?: boolean,
    mouseOverImage?: string,
    mousePressedImage?: string,
}

/** Interface for Buttons which manage a selected state extends IButton */
export interface IButtonSelectable extends IButton {
    selected?: boolean
}