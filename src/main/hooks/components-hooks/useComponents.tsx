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

import { ReactElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import _ from "underscore";
import { appContext } from "../../contexts/AppProvider";
import { componentHandler, createCustomComponentWrapper } from "../../factories/UIFactory";
import BaseComponent from "../../util/types/BaseComponent";
import Dimension from "../../util/types/Dimension";

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
const useComponents = (id: string, className:string): [Array<BaseComponent>, Array<ReactElement>, Map<string,ComponentSizes>| undefined] => {
    /** Current state of the preferredSizes of a parents Childcomponents */
    const [preferredSizes, setPreferredSizes] = useState<Map<string, ComponentSizes>>();

    /** A cache for componentsizes before preferredSizes is being set */
    const tempSizes = useRef<Map<string, ComponentSizes>>(new Map<string, ComponentSizes>())

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** A reference map of which components have already been added */
    const componentsChildren = useRef<Map<string, Array<string>>>(new Map<string, Array<string>>());

    
    /** Builds the Childcomponents of a parent and sets/updates their preferred size */
    const buildComponents = useCallback((): Array<ReactElement> => {
        let componentsChanged = false
        const children = context.contentStore.getChildren(id, className);

        // Deletes the components out of tempSizes if they are no longer visible/available
        tempSizes.current.forEach((val, key) => {
            if (!children.has(key)) {
                tempSizes.current.delete(key)
                componentsChanged = true;
            }
        });

        if (componentsChanged) {
            setPreferredSizes(new Map(tempSizes.current));
        }
        
        const reactChildrenArray: Array<ReactElement> = [];

        /**
         * This function gets called when onLoadcallback of a component is called, if all components of a parents are loaded,
         * set the preferredSizes, if the components change update the current preferredSizes.
         * @param compSizes - the old compSizes
         * @param newPref - the preferred size of the component
         * @param newMin - the minimum size of the component
         * @param newMax - the maximum size of the component
         */
        const sizesChanged = (compSizes:ComponentSizes|undefined, newPref:Dimension, newMin:Dimension, newMax:Dimension) => {
            if (compSizes) {
                if (_.isEqual(compSizes.preferredSize, newPref) && _.isEqual(compSizes.minimumSize, newMin) && _.isEqual(compSizes.maximumSize, newMax)) {
                    return false;
                }
            }
            return true;
        }

        // Returns true, if the children have changed from before 
        const childrenChanged = (compId:string) => {
            const arraysEqual = (a:string[], b:string[]) => {
                let aClone = [...a];
                let bClone = [...b];
                if (aClone === bClone) return true;
                if (aClone === null || bClone === null) return false;
                if (aClone.length !== bClone.length) return false;
                
                aClone.sort();
                bClone.sort();
              
                for (var i = 0; i < aClone.length; ++i) {
                  if (aClone[i] !== bClone[i]) return false;
                }
                return true;
              }

            if (componentsChildren.current.has(compId)) {
                return !arraysEqual(componentsChildren.current.get(compId) as string[], Array.from(context.contentStore.getChildren(compId).keys()));
            }
            else {
                return true;
            }
        }

        /** Callback which gets called by each component in sendOnLoadCallBack */
        const componentHasLoaded = (compId: string, prefSize:Dimension, minSize:Dimension, maxSize:Dimension) => {
            let componentsChanged = false
            tempSizes.current.forEach((val, key) => {
                if (!children.has(key)) {
                    tempSizes.current.delete(key);
                    componentsChanged = true;
                }
            });
            const preferredComp = tempSizes.current.get(compId);
            tempSizes.current.set(compId, {preferredSize: prefSize, minimumSize: minSize, maximumSize: maxSize});
            /** If all components are loaded or it is a tabsetpanel and the size changed, set the sizes */
            if(context.contentStore.getComponentById(compId) && (tempSizes.current.size === children.size || id.includes('TP')) && (sizesChanged(preferredComp, prefSize, minSize, maxSize) || childrenChanged(compId) || componentsChanged)) {
                setPreferredSizes(new Map(tempSizes.current));
            }
                
            //Set Preferred Sizes of changed Components
            if(preferredSizes && preferredSizes.has(compId)){
                const preferredComp = preferredSizes.get(compId);
                if(preferredComp && (sizesChanged(preferredComp, prefSize, minSize, maxSize) || childrenChanged(compId))){
                    preferredComp.preferredSize = prefSize;
                    preferredComp.minimumSize = minSize;
                    preferredComp.maximumSize = maxSize
                    setPreferredSizes(new Map(preferredSizes));
                }
            }
            componentsChildren.current.set(compId, Array.from(context.contentStore.getChildren(compId).keys()));
        }

        /** If there are no children set an empty map */
        if(children.size === 0 && !preferredSizes) {
            setPreferredSizes(new Map<string, ComponentSizes>());
        }

        /** Create the reactchildren */
        children.forEach(child => {
            let reactChild;
            child.onLoadCallback = componentHasLoaded;
            if (!context.contentStore.customComponents.has(child.name)) {
                if (id.includes("popup")) {
                    context.subscriptions.propertiesSubscriber.get(child.id)?.apply(undefined, [child]);
                }
                reactChild = componentHandler(child, context.contentStore);
            }
            /** If it is a custom component, put the custom component in the CustomComponentWrapper */
            else {
                let customComp = context.contentStore.customComponents.get(child.name)?.apply(undefined, []);
                reactChild = createCustomComponentWrapper({...child, component: customComp, isGlobal: false});
            }
                
            if(reactChild){
                reactChildrenArray.push(reactChild);
            }
        });
        return reactChildrenArray;
        
    },[context.contentStore, id, preferredSizes, className, tempSizes.current]);
    
    /** Current state of a parents Childcomponents as reactchildren */
    const [components, setComponents] = useState<Array<ReactElement>>(buildComponents());

    // The children components of a parent
    const children = useMemo(() => Array.from(context.contentStore.getChildren(id).values()), [components]);

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
                    if(nc.props.id === oc.props.id && !context.contentStore.customComponents.has(nc.props.name)){
                        alreadyAdded = true
                        cl.push(oc);
                    }
                });
                if(!alreadyAdded && !context.contentStore.removedCustomComponents.has(nc.props.name)) {
                    cl.push(nc);
                }
            });
            setComponents(cl);
        });

        return () => {
            context.subscriptions.unsubscribeFromParentChange(id);
        }
    }, [context.subscriptions, id, components, buildComponents, context.contentStore.customComponents]);

    return [children, components, preferredSizes];
}
export default useComponents;