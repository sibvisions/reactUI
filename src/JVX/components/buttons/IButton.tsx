import BaseComponent from "../BaseComponent";

export interface IButton extends BaseComponent {
    accelerator: string,
    eventAction: boolean,
    horizontalTextPosition?:number,
    verticalTextPosition?:number,
    borderPainted?: boolean,
    imageTextGap?: number,
    borderOnMouseEntered?: boolean,
    enabled?: boolean
}