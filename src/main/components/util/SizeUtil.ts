/** Other imports */
import { MapLocation, Dimension } from ".";
import BaseComponent from "../BaseComponent";
import COMPONENT_CLASSNAMES from "../COMPONENT_CLASSNAMES";
import { ComponentSizes } from "../zhooks";

/**
 * Splits up the given size and returns it as a Size object
 * @param size - the size for the component
 * @returns split up size as object 
 */
export function parsePrefSize(prefSize:string|undefined):Dimension|undefined {
    if (prefSize) {
        const sizeSplitted = prefSize.split(',');
        return {width: parseInt(sizeSplitted[0]), height: parseInt(sizeSplitted[1])};
    }
    else
        return undefined;
}

export function parseMinSize(minSize:string|undefined):Dimension|undefined {
    if (minSize) {
        const sizeSplitted = minSize.split(',');
        return {width: parseInt(sizeSplitted[0]), height: parseInt(sizeSplitted[1])};
    }
    else {
        return undefined;
    }
}

export function parseMaxSize(maxSize:string|undefined):Dimension|undefined {
    if (maxSize) {
        const sizeSplitted = maxSize.split(',');
        return {width: parseInt(sizeSplitted[0]), height: parseInt(sizeSplitted[1])};
    }
    else {
        return undefined;
    }
}

/**
 * Splits up the given location and returns it as a MapLocation object
 * @param location - the location for the point
 * @returns split up location (longitude, latitude) as object
 */
export function parseMapLocation(location:string|undefined):MapLocation|undefined {
    if (location) {
        const locationSplitted = location.split(',');
        return {latitude: parseFloat(locationSplitted[0]), longitude: parseFloat(locationSplitted[1])};
    }
    else
        return undefined;
}

/**
 * Returns the preferred size of the given component.
 * @param component - the component which preferred size is returned
 * @param componentSizes - the map of componentsizes of a layout
 * @returns the preferred size of the given component.
 */
export function getPreferredSize(component:BaseComponent, componentSizes:Map<string, ComponentSizes>) {
    if (componentSizes.has(component.id)) {
        //If prefSize is less than maxSize and more than minSize is already checked in sendOnLoadCallBack!
        return componentSizes.get(component.id)!.preferredSize;
    }
    return undefined;
}

export function getMinimumSize(component:BaseComponent, componentSizes:Map<string, ComponentSizes>) {
    let minimumSize:Dimension = { height: 0, width: 0 }
    if (componentSizes.has(component.id)) {
        if (component.minimumSize || componentSizes.get(component.id)!.minimumSize !== undefined) {
            minimumSize = componentSizes.get(component.id)!.minimumSize;
        }
        else if (component.className === COMPONENT_CLASSNAMES.TABLE
                || component.className === COMPONENT_CLASSNAMES.TREE
                || component.className === COMPONENT_CLASSNAMES.CHART) {
            minimumSize = { height: 0, width: 0 };
        }
        else {
            minimumSize = Object.assign({}, componentSizes.get(component.id)!.preferredSize);
            if (component.className === COMPONENT_CLASSNAMES.LABEL && minimumSize.width > 50 && component.text) {
                minimumSize.width = 50;
            }
        }

        if (component.maximumSize) {
            let dimMax:Dimension = componentSizes.get(component.id)!.maximumSize;
            if (dimMax) {
                if (dimMax.width < minimumSize.width) {
                    minimumSize.width = dimMax.width;
                }
    
                if (dimMax.height < minimumSize.height) {
                    minimumSize.height = dimMax.height;
                }
            }
        }
    }
    return minimumSize;
}