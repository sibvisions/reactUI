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

// Function to sort the components according to their top and left positions
export function quickSort(components: { top: number, left: number, name: string }[], low: number, high: number): void {
    if (low < high) {
        // Finding the separator (pivot)
        let pivotIndex: number = partition(components, low, high);

        // Sort the two halves recursively
        quickSort(components, low, pivotIndex - 1);
        quickSort(components, pivotIndex + 1, high);
    }
}

// Helper function to split the array and find the pivot index
function partition(components: { top: number, left: number, name: string }[], low: number, high: number): number {
    // Use the last element as a pivot
    let pivot: { top: number, left: number, name: string } = components[high];
    let i: number = low - 1;

    for (let j: number = low; j < high; j++) {
        // Compare the top positions
        if (components[j].top <= pivot.top) {
            i++;

            // Swap positions
            let temp: { top: number, left: number, name: string } = components[i];
            components[i] = components[j];
            components[j] = temp;
        } else if (components[j].top === pivot.top) {
            // If the top positions are the same, compare the left positions
            if (components[j].left <= pivot.left) {
                // Swap positions
                i++;
                let temp: { top: number, left: number, name: string } = components[i];
                components[i] = components[j];
                components[j] = temp;
            }
        }
    }

    // Swap the pivot element with the element at the (i+1)th index
    let temp: { top: number, left: number, name: string } = components[i + 1];
    components[i + 1] = components[high];
    components[high] = temp;

    // Return the index of the pivot element
    return i + 1;
}