/** Other import */
import BaseComponent from "../BaseComponent";

/** Interface for Buttons contains properties which are sent by the server */
export interface IButton extends BaseComponent {
    accelerator: string,
    eventAction: boolean,
    horizontalTextPosition?:number,
    verticalTextPosition?:number,
    borderPainted?: boolean,
    imageTextGap?: number,
    borderOnMouseEntered?: boolean,
    enabled?: boolean
    mouseOverImage?: string,
    mousePressedImage?: string
    ariaLabel?: string;
}

/** Interface for Buttons which manage a selected state extends IButton */
export interface IButtonSelectable extends IButton {
    selected?: boolean
}