import { Size } from "./Size";
import { FindReact } from "./FindReact";

export function getPreferredSize(comp) {
    let prefSize;
        if (comp) {
            if (comp.props.preferredSize) {
                prefSize = new Size(undefined, undefined, comp.props.preferredSize)
            }
            else {
                let element = document.getElementById(comp.props.id);
                if (element && element.getBoundingClientRect()) {
                    if (element.classList.contains('p-togglebutton') || element.classList.contains('p-radiobutton')) {
                        let calcWidth = 0;
                        let widthMargins = 0;
                        let calcHeight = 0;
                        let heightMargins = 0;
                        let reactObj = FindReact(element)
                        if (comp.props.horizontalTextPosition !== 1) {
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
                        calcWidth += reactObj.props.style.paddingLeft + reactObj.props.style.paddingRight + widthMargins + 2;
                        calcHeight += reactObj.props.style.paddingTop + reactObj.props.style.paddingBottom + heightMargins + 2;
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
            if (comp.props.minimumSize) {
                let minSize = new Size(undefined, undefined, comp.props.minimumSize)
                if (prefSize.width < minSize.width) {
                    prefSize.setWidth(minSize.width);
                }
                if (prefSize.height < minSize.height) {
                    prefSize.setHeight(minSize.height);
                }
                if (prefSize.width === 0) {
                    prefSize.setHeight(minSize.width);
                }
                if (prefSize.height === 0) {
                    prefSize.setHeight(minSize.height)
                }
            }

            if (comp.props.maximumSize) {
                let maxSize = new Size(undefined, undefined, comp.props.maximumSize);
                if (maxSize.width < prefSize.width) {
                    prefSize.setWidth(maxSize.width);
                }
                if (maxSize.height < prefSize.height) {
                    prefSize.setHeight(maxSize.height);
                }
                if (prefSize.width === 0) {
                    prefSize.setHeight(maxSize.width);
                }
                if (prefSize.height === 0) {
                    prefSize.setHeight(maxSize.height)
                }
            }
            return prefSize
        }
}

export function getHooksPreferredSize(props) {
    let prefSize;
    if (props) {
        if (props.preferredSize) {
            prefSize = new Size(undefined, undefined, props.preferredSize)
        }
        else {
            let element = document.getElementById(props.id)
            if (element.getBoundingClientRect()) {
                prefSize = new Size(Math.ceil(element.getBoundingClientRect().width), Math.ceil(element.getBoundingClientRect().height))
            }
            else {
                prefSize = new Size(element.offsetWidth, element.offsetHeight)
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
                prefSize.setHeight(minSize.width);
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
                prefSize.setHeight(maxSize.width);
            }
            if (prefSize.height === 0) {
                prefSize.setHeight(maxSize.height)
            }
        }
        return prefSize
    }
}