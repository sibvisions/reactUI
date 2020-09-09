import { Size } from "./Size";
import { FindReact } from "./FindReact";
import { ToggleButton } from "primereact/togglebutton";

export function getPreferredSize(props) {
    let prefSize;
        if (props) {
            if (props.preferredSize) {
                prefSize = new Size(undefined, undefined, props.preferredSize)
            }
            else {
                let element = document.getElementById(props.id);
                if (element && element.getBoundingClientRect()) {
                    if (element.classList.contains('p-togglebutton') || element.classList.contains('p-splitbutton')) {
                        let calcWidth = 0;
                        let widthMargins = 0;
                        let calcHeight = 0;
                        let heightMargins = 0;
                        let reactObj = FindReact(element)
                        if (props.horizontalTextPosition !== 1) {
                            for (let child of element.children) {
                                calcWidth += Math.ceil(parseFloat(getComputedStyle(child).width))
                                widthMargins += Math.ceil(parseFloat(getComputedStyle(child).marginLeft)) + Math.ceil(parseFloat(getComputedStyle(child).marginRight));
                                if (Math.ceil(parseFloat(getComputedStyle(child).height)) > calcHeight) {
                                    calcHeight = Math.ceil(parseFloat(getComputedStyle(child).height))
                                }
                            }
                        }
                        else {
                            for (let child of element.children) {
                                calcHeight += Math.ceil(parseFloat(getComputedStyle(child).height))
                                heightMargins += Math.ceil(parseFloat(getComputedStyle(child).marginTop)) + Math.ceil(parseFloat(getComputedStyle(child).marginBottom));
                                if (Math.ceil(parseFloat(getComputedStyle(child).width)) > calcWidth) {
                                    calcWidth = Math.ceil(parseFloat(getComputedStyle(child).width))
                                }
                            }
                        }
                        if (reactObj instanceof ToggleButton) {
                            calcWidth += reactObj.props.style.paddingLeft + reactObj.props.style.paddingRight + widthMargins + 2;
                            calcHeight += reactObj.props.style.paddingTop + reactObj.props.style.paddingBottom + heightMargins + 2;
                        }
                        prefSize = new Size(calcWidth, calcHeight, undefined)
                         
                    }
                    else {
                        prefSize = new Size(Math.ceil(element.getBoundingClientRect().width), Math.ceil(element.getBoundingClientRect().height), undefined)
                    }
                }
                else if (element) {
                    prefSize = new Size(element.offsetWidth, element.offsetHeight, undefined)
                }
                else {
                    prefSize = null
                }
            }
            if (props.minimumSize) {
                let minSize = new Size(undefined, undefined, props.minimumSize)
                if (prefSize.width < minSize.width) {
                    prefSize.setWidth(minSize.width);
                }
                if (prefSize.height < minSize.height) {
                    prefSize.setHeight(minSize.height);
                }
                if (prefSize.width === 0) {
                    prefSize.setWidth(minSize.width);
                }
                if (prefSize.height === 0) {
                    prefSize.setHeight(minSize.height)
                }
            }

            if (props.maximumSize) {
                let maxSize = new Size(undefined, undefined, props.maximumSize);
                if (maxSize.width < prefSize.width) {
                    prefSize.setWidth(maxSize.width);
                }
                if (maxSize.height < prefSize.height) {
                    prefSize.setHeight(maxSize.height);
                }
                if (prefSize.width === 0) {
                    prefSize.setWidth(maxSize.width);
                }
                if (prefSize.height === 0) {
                    prefSize.setHeight(maxSize.height)
                }
            }
            return prefSize
        }
}

export function getMinimumSize(props) {
    let minSize;
    if (props) {
        if (props.minimumSize) {
            minSize = new Size (undefined, undefined, props.minimumSize);
        }
        else {
            minSize = getPreferredSize(props);
        }

        if (props.maximumSize) {
            let maxSize = new Size(undefined, undefined, props.maximumSize);
            if (maxSize.width < minSize.width) {
                minSize.setWidth(maxSize.width);
            }
            if (maxSize.height < minSize.height) {
                minSize.setHeight(maxSize.height);
            }
        }
        return minSize
    }
}

export function getMaximumSize(props) {
    let maxSize;
    if (props) {
        if (props.maximumSize) {
            maxSize = new Size(undefined, undefined, props.maximumSize);
        }
        else {
            maxSize = new Size(Math.pow(2, 31) - 1, Math.pow(2, 31) - 1, undefined)
        }
        return maxSize;
    }
}