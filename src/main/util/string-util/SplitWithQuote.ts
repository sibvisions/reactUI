/* Copyright 2023 SIB Visions GmbH
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

/**
 * Returns a stringified version of the object, which recursively stringifies every key and value of the object.
 * @param object - the object to stringify
 */
export function asList(value:string, delimiter:string = "'") {
    let classes:string[] = [];

    let first:number = 0;
    let last:number = 0;
    let quote:boolean = false;

    for (let i = 0; i < value.length; i++, last++) {
      let char = value[i];

      if (char == ";") {
        if (!quote) {
          classes.push(value.substring(first, last).replaceAll("'", ""));

          first = i + 1;
          last = i;
        }
      }
      else if (char == "'") {
        quote = !quote;
      }
    }

    return classes;
}