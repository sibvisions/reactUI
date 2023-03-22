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

/** Helper method to concatenate class names and filter out falsy values */
export function concatClassnames(...classNames: any) {
    if (classNames) {
        let classes:any[] = [];

        for (let i = 0; i < classNames.length; i++) {
            let className = classNames[i];

            if (!className) continue;

            const type = typeof className;

            if (type === 'string' || type === 'number') {
                classes.push(className);
            } else if (type === 'object') {
                const _classes = Array.isArray(className) ? className : Object.entries(className).map(([key, value]) => (!!value ? key : null));

                classes = _classes.length ? classes.concat(_classes.filter((c) => !!c)) : classes;
            }
        }

        return classes.join(' ');
    }

    return undefined;
}