import BaseComponent from "../BaseComponent";

export interface IButton extends BaseComponent {
    accelerator: string,
    eventAction: boolean,
    text: string,
    horizontalTextPosition?:number,
    verticalTextPosition?:number,
    borderPainted?: boolean,
    imageTextGap?: number,
    borderOnMouseEntered?: boolean
}