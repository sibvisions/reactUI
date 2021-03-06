/** React imports */
import { ReactElement, useCallback, useContext, useEffect, useState } from "react";

/** 3rd Party imports */
import _ from "underscore";

/** Other imports */
import { appContext } from "../../AppProvider";
import { componentHandler, createCustomComponentWrapper } from "../../factories/UIFactory";
import { Dimension } from "../util";

export type ComponentSizes = {
    preferredSize: Dimension,
    minimumSize: Dimension,
    maximumSize: Dimension
}

/**
 * A hook which returns the state of a parents rendered Childcomponents and their preferred size 
 * @param id - the id of the component
 * @returns a layouts rendered Childcomponents and their preferred size
 */
const useComponents = (id: string): [Array<ReactElement>, Map<string,ComponentSizes>| undefined] => {
    /** Current state of the preferredSizes of a parents Childcomponents */
    const [preferredSizes, setPreferredSizes] = useState<Map<string, ComponentSizes>>();
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Builds the Childcomponents of a parent and sets/updates their preferred size */
    const buildComponents = useCallback((): Array<ReactElement> => {
        let tempSizes = new Map<string, ComponentSizes>();
        /** If the preferredSizes get updated and components have been removed, remove it from tempSizes */
        if (preferredSizes) {
            tempSizes = preferredSizes
            tempSizes.forEach((val, key) => {
                if (!context.contentStore.flatContent.has(key) && !context.contentStore.replacedContent.has(key) || context.contentStore.flatContent.get(key)?.visible === false) {
                    tempSizes.delete(key)
                }
            });
        }

        /** Gets the Childcomponents of the parent */
        const children = context.contentStore.getChildren(id);
        const reactChildrenArray: Array<ReactElement> = [];
        /**
         * This function gets called when onLoadcallback of a component is called, if all components of a parents are loaded,
         * set the preferredSizes, if the components change update the current preferredSizes.
         * @param compId - the component id
         * @param height - the preferred height of the component
         * @param width - the preferred width of the component
         */

        const sizesChanged = (compSizes:ComponentSizes|undefined, newPref:Dimension, newMin:Dimension, newMax:Dimension) => {
            if (_.isEqual(compSizes?.preferredSize, newPref) && _.isEqual(compSizes?.minimumSize, newMin) && _.isEqual(compSizes?.maximumSize, newMax)) {
                return false;
            }
            else {
                return true;
            }
        }

        const componentHasLoaded = (compId: string, prefSize:Dimension, minSize:Dimension, maxSize:Dimension)=> {
            const preferredComp = tempSizes.get(compId)
            tempSizes.set(compId, {preferredSize: prefSize, minimumSize: minSize, maximumSize: maxSize});
            /** If all components are loaded or it is a tabsetpanel and the size changed, set the sizes */
            if((tempSizes.size === children.size || id.includes('TP')) && sizesChanged(preferredComp, prefSize, minSize, maxSize)) {
                setPreferredSizes(new Map(tempSizes));
            }
                
            //Set Preferred Sizes of changed Components
            if(preferredSizes && preferredSizes.has(compId)){
                const preferredComp = preferredSizes.get(compId);
                if(preferredComp && sizesChanged(preferredComp, prefSize, minSize, maxSize)){
                    preferredComp.preferredSize = prefSize;
                    preferredComp.minimumSize = minSize;
                    preferredComp.maximumSize = maxSize
                    setPreferredSizes(new Map(preferredSizes));
                }
            }
        }

        /** If there are no children set an empty map */
        if(children.size === 0 && !preferredSizes){
            setPreferredSizes(new Map<string, ComponentSizes>());
        }

        /** If there are components in tempSizes which are not longer in the current children (got removed, invisible), remove them and set preferredSize */
        if (tempSizes.size > children.size) {
            tempSizes.forEach((value, key) => {
                if(!children.has(key))
                    tempSizes.delete(key)
            });
            if (tempSizes.size === children.size)
                setPreferredSizes(new Map(tempSizes))
        }

        /** Create the reactchildren */
        children.forEach(child => {
            let reactChild;
            child.onLoadCallback = componentHasLoaded;
            if (!context.contentStore.customContent.has(child.name))
                reactChild = componentHandler(child);
                
            /** If it is a custom component, put the custom component in the CustomComponentWrapper */
            else {
                let customComp = context.contentStore.customContent.get(child.name)?.apply(undefined, []);
                reactChild = createCustomComponentWrapper(child, customComp);
            }
                
            if(reactChild){
                reactChildrenArray.push(reactChild);
            }
        });
        return reactChildrenArray;
    },[context.contentStore, id, preferredSizes]);
    
    /** Current state of a parents Childcomponents as reactchildren */
    const [components, setComponents] = useState<Array<ReactElement>>(buildComponents());

    /**
     * Subscribes the parent to childcomponent changes
     * @returns unsubscribes from childcomponent changes
     */
    useEffect(() => {
        context.subscriptions.subscribeToParentChange(id, () => {
            /** New Components when component changes */
            const newComponents = buildComponents();
            /** Contains the components */
            const cl = new Array<ReactElement>();
            newComponents.forEach(nc => {
                let alreadyAdded = false
                /** Checks if the new component is already added in the current components if yes add the old component else the new one */
                components.forEach(oc => {
                    if(nc.props.id === oc.props.id && !context.contentStore.customContent.has(nc.props.name)){
                        alreadyAdded = true
                        cl.push(oc);
                    }
                });
                if(!alreadyAdded) {
                    cl.push(nc);
                }
            });
            setComponents(cl);
        });

        return () => {
            context.subscriptions.unsubscribeFromParentChange(id);
        }
    }, [context.subscriptions, id, components, buildComponents, context.contentStore.customContent]);

    return [components, preferredSizes];
}
export default useComponents;