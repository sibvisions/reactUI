import React, { Component } from 'react';
import { RefContext } from '../helper/Context';
import { Size } from '../helper/Size';

import FormLayout from '../layouts/FormLayout'
import BorderLayout from '../layouts/BorderLayout'
import FlowLayout from '../layouts/FlowLayout';
import GridLayout from "../layouts/GridLayout";
import NullLayout from '../layouts/NullLayout';
import { Gaps } from '../layouts/layoutObj/Gaps';
import { Margins } from '../layouts/layoutObj/Margins';
import { Orientation } from '../layouts/layoutObj/Orientation';
import { GridSize } from '../layouts/layoutObj/GridSize';
import { checkFlowAlignments, checkFormAlignments, mapFlex, checkAlignments } from '../helper/CheckAlignments';
import { UIFont } from '../helper/UIFont';
import { FindReact } from '../helper/FindReact';
import tinycolor from 'tinycolor2';

class Base extends Component {

    state = { 
        
    }

    startUp(){
        let content = [];
        content.length = 0
        if (this.props.subjects) {
            this.props.subjects.forEach(subject => {
                let temp = this.context.uiBuilder.compontentHandler(subject);
                if(temp) content.push(temp)
            });
            this.setState({content: content});
        }
    }

    getPanelBgdColor() {
        if (document.getElementById(this.props.id) !== null) {
            if (this.props.background) {
                return this.props.background
            }
            else {
                if (this.context.contentStore.flatContent.find(elem => elem.id === this.props.parent) === undefined) {
                    return document.getElementById(this.props.id).parentElement.style.backgroundColor;
                }
                else {
                    return document.getElementById(this.props.parent).style.background;
                }
            }
        }
    }

    getBtnBgdColor() {
        if (document.getElementById(this.props.id) !== null) {
            if (this.props.borderPainted === undefined || this.props.borderPainted === true) {
                if (this.props.background) {
                    return tinycolor(this.props.background);
                }
                else {
                    return tinycolor("#007ad9");
                }
            }
            else {
                return tinycolor(document.getElementById(this.props.parent).style.background);
            }
        }
    }

    getMargins() {
        if (this.props.margins) {
            return new Margins(this.props.margins.split(','));
        }
        else {
            if (this.props.className === "Button") {
                return new Margins([5, 5, 5, 5]);
            }
            else if (this.props.className === "Label") {
                return new Margins([0, 0, 0, 0]);
            }
        }
    }

    getAlignments() {
        if (this.props.className === "Button" || this.props.className === "Label") {
            return mapFlex(checkAlignments(this.props));
        }
        else {
            return checkAlignments(this.props);
        }
    }

    getFont() {
        if (this.props.font) {
            return new UIFont(this.props.font.split(','));
        }
        else {
            return new UIFont(["Tahoma", 0, 11]);
        }
    }

    getImageTextGap() {
        if (this.props.imageTextGap) {
            return this.props.imageTextGap;
        }
        else {
            return 4;
        }
    }

    parseIconData(iconData) {
        if (iconData !== undefined) {
            let splittedIconData;
            let iconName;
            let iconSize;
            let iconColor;
            if (iconData.includes("FontAwesome")) {
                let iconString = iconData.slice(iconData.indexOf('.') + 1)
                let index = iconData.indexOf(";")
                if (index < 0) {
                    splittedIconData = iconString.split(',');
                    iconName = "fas fa-" + splittedIconData[0];
                    iconSize = new Size(splittedIconData[1], splittedIconData[2]);
                    iconColor = this.props.foreground !== undefined ? this.props.foreground : tinycolor('black');
                    return {icon: iconName, size: iconSize, color: iconColor};
                }
                else {
                    splittedIconData = iconString.split(';');
                    iconName = "fas fa-" + splittedIconData[0];
                    splittedIconData.splice(splittedIconData, 1)
                    let sizeFound = false;
                    let colorFound = false;
                    splittedIconData.forEach(prop => {
                        if (prop.indexOf("size") >= 0) {
                            iconSize = new Size(prop.substring(prop.indexOf('=')+1), prop.substring(prop.indexOf('=')+1));
                            sizeFound = true;
                        }
                        else if (prop.indexOf("color") >= 0) {
                            iconColor = prop.substring(prop.indexOf('=')+1, prop.indexOf(','));
                            colorFound = true;
                        }
                    });
                    if (!sizeFound) {
                        iconSize = new Size(iconString[1], iconString[2]);
                    }
                    if (!colorFound) {
                        iconColor = this.props.foreground !== undefined ? this.props.foreground : tinycolor('black');
                    }
                    return {icon: iconName, size: iconSize, color: iconColor};
                }
            }
            else {
                this.customIcon = true;
                splittedIconData = iconData.split(',');
                iconName = splittedIconData[0];
                iconSize = new Size(splittedIconData[1], splittedIconData[2]);
                iconColor = null;
                return {icon: iconName, size: iconSize, color: iconColor};
            }
        }
    }

    getPreferredSize(comp) {
        let prefSize;
        if (comp) {
            if (comp.props.preferredSize) {
                prefSize = new Size(undefined, undefined, comp.props.preferredSize)
            }
            else {
                let element = document.getElementById(comp.props.id);
                if (element.getBoundingClientRect()) {
                    if (element.classList.contains('p-togglebutton')) {
                        let toggleBtnWidth = 0;
                        let widthMargins = 0;
                        let toggleBtnHeight = 0;
                        let heightMargins = 0;
                        let reactObj = FindReact(element)
                        if (comp.props.horizontalTextPosition !== 1) {
                            for (let child of element.children) {
                                toggleBtnWidth += Math.ceil(parseFloat(getComputedStyle(child).width))
                                widthMargins += Math.ceil(parseFloat(getComputedStyle(child).marginLeft)) + Math.ceil(parseFloat(getComputedStyle(child).marginRight));
                                if (Math.ceil(parseFloat(getComputedStyle(child).height)) > toggleBtnHeight) {
                                    toggleBtnHeight = Math.ceil(parseFloat(getComputedStyle(child).height))
                                }
                            }
                        }
                        else {
                            for (let child of element.children) {
                                toggleBtnHeight += Math.ceil(parseFloat(getComputedStyle(child).height))
                                heightMargins += Math.ceil(parseFloat(getComputedStyle(child).marginTop)) + Math.ceil(parseFloat(getComputedStyle(child).marginBottom));
                                if (Math.ceil(parseFloat(getComputedStyle(child).width)) > toggleBtnWidth) {
                                    toggleBtnWidth = Math.ceil(parseFloat(getComputedStyle(child).width))
                                }
                            }
                        }
                        toggleBtnWidth += reactObj.props.style.paddingLeft + reactObj.props.style.paddingRight + widthMargins + 2;
                        toggleBtnHeight += reactObj.props.style.paddingTop + reactObj.props.style.paddingBottom + heightMargins + 2;
                        prefSize = new Size(toggleBtnWidth, toggleBtnHeight, undefined)
                    }
                    else {
                        prefSize = new Size(Math.ceil(element.getBoundingClientRect().width), Math.ceil(element.getBoundingClientRect().height), undefined)
                    }
                }
                else {
                    prefSize = new Size(element.offsetWidth, element.offsetHeight, undefined)
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
    
    componentDidMount() {
        this.startUp();
    }

    getMinimumSize(comp) {
        let minSize;
        if (comp) {
            if (comp.props.minimumSize) {
                minSize = new Size(undefined, undefined, comp.props.minimumSize);
            }
            else {
                minSize = this.getPreferredSize(comp);
            }
    
            if (comp.props.maximumSize) {
                let maxSize = new Size(undefined, undefined, comp.props.maximumSize);
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

    getMaximumSize(comp) {
        let maxSize;
        if (comp) {
            if (comp.props.maximumSize) {
                maxSize = new Size(undefined, undefined, comp.props.maximumSize);
            }
            else {
                maxSize = new Size(Math.pow(2, 31) - 1, Math.pow(2, 31) - 1, undefined)
            }
            return maxSize;
        }
    }

    isVisible(comp) {
        if (comp) {
            if (comp.props.visible === undefined || comp.props.visible) {
                return true;
            }
            else {
                return false;
            }
        }
    }

    insertLayout() {
        if (this.state.content !== undefined) {
            if (this.props.layout !== null) {
                let margins = new Margins(this.props.layout.substring(this.props.layout.indexOf(',') + 1, this.props.layout.length).split(',').slice(0, 4))
                let gaps = new Gaps(this.props.layout.substring(this.props.layout.indexOf(',') + 1, this.props.layout.length).split(',').slice(4, 6))
                switch (this.props.layout.substring(0, this.props.layout.indexOf(','))) {
                    case "FormLayout":
                        var alignments = checkFormAlignments(this.props.layout.substring(this.props.layout.indexOf(',') + 1, this.props.layout.length).split(',').slice(6, 8), 'form')
                        return <FormLayout
                            component={this}
                            layout={this.props.layout}
                            layoutData={this.props.layoutData}
                            subjects={this.state.content}
                            margins={margins}
                            gaps={gaps}
                            alignments={alignments}
                            preferredSize={this.getPreferredSize(this)}
                            minimumSize={this.props.minimumSize}
                            maximumSize={this.props.maximumSize}
                            getPreferredSize={this.getPreferredSize}
                            getMinimumSize={this.getMinimumSize}
                            getMaximumSize={this.getMaximumSize}
                            isVisible={this.isVisible} />;
                    case "BorderLayout":
                        return <BorderLayout
                            component={this}
                            subjects={this.state.content}
                            margins={margins}
                            gaps={gaps}
                            preferredSize={this.getPreferredSize(this)}
                            minimumSize={this.props.minimumSize}
                            maximumSize={this.props.maximumSize}
                            getPreferredSize={this.getPreferredSize}
                            getMinimumSize={this.getMinimumSize}
                            getMaximumSize={this.getMaximumSize}
                            isVisible={this.isVisible} />;
                    case "FlowLayout":
                        let orientation = new Orientation(this.props.layout.substring(this.props.layout.indexOf(',') + 1, this.props.layout.length).split(',').slice(6, 7));
                        alignments = mapFlex(checkFlowAlignments(this.props.layout.substring(this.props.layout.indexOf(',') + 1, this.props.layout.length).split(',').slice(7, 10), 'flow'));
                        return <FlowLayout
                            component={this}
                            subjects={this.state.content}
                            margins={margins}
                            gaps={gaps}
                            orientation={orientation.orientation}
                            alignments={alignments}
                            preferredSize={this.getPreferredSize(this)}
                            minimumSize={this.props.minimumSize}
                            maximumSize={this.props.maximumSize}
                            getPreferredSize={this.getPreferredSize}
                            isVisible={this.isVisible} />;
                    case "GridLayout":
                        let gridSize = new GridSize(this.props.layout.substring(this.props.layout.indexOf(',') + 1, this.props.layout.length).split(',').slice(6, 8));
                        return <GridLayout
                            component={this}
                            subjects={this.state.content}
                            margins={margins}
                            gaps={gaps}
                            gridSize={gridSize}
                            preferredSize={this.getPreferredSize(this)}
                            minimumSize={this.props.minimumSize}
                            maximumSize={this.props.maximumSize}
                            getPreferredSize={this.getPreferredSize}
                            isVisible={this.isVisible} />;
                    default: return <NullLayout
                        component={this}
                        subjects={this.state.content}
                        getPreferredSize={this.getPreferredSize}
                        isVisible={this.isVisible} />;
                }
            }
            else {
                return <NullLayout
                    component={this}
                    subjects={this.state.content}
                    getPreferredSize={this.getPreferredSize}
                    isVisible={this.isVisible} />;
            }
        }
    }
}
Base.contextType = RefContext
export default Base;