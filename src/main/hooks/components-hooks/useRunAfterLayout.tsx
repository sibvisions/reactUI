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

import { useLayoutEffect, useRef } from "react";

//Calls a function after layouting
export function useRunAfterLayout() {
    let torun = useRef<Function[]>([]);
    
    useLayoutEffect(() => {
        while(torun.current.length) {
            const f = torun.current.pop();
            f && f();
        }
        torun.current = [];
    }, [torun.current]);

    return (r:Function) => {
        torun.current.push(r)
    }
} 