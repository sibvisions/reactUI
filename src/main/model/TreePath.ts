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

/**
 * A TreePath stores the path of node in a tree.
 * It is stored as int array representing the selected row in the corresponding level.
 * eg:
 * [] empty array means tree path for the root page.
 * [1] the detail page for the row 1 of root page.
 * [1, 2] the detail page for the row 2 of the detail page for the row 1 of the root page.  
 */
class TreePath {
    array:number[];
    static EMPTY = new TreePath();

    constructor(...path:number[]|[number[]]) {
        if (typeof path[0] === "object")
            this.array = path[0] as number[];
        else
            this.array = path as number[];
    }

    /**
     * Returns the array as string
     * @returns the array as string
     */
    toString() {
        return JSON.stringify(this.array);
    }

    /**
     * Gets the length of the array
     * @returns the length of the array
     */
    length() {
        return this.array.length;
    }

    /**
     * Gets the value of given index
     * @param index - the index
     * @returns the value of given index
     */
    get(index:number) {
        return this.array[index];
    }

    /**
     * Gets the value of the last index
     * @returns the value of the last index
     */
    getLast() {
        if (this.array.length === 0)
            return -1;
        else
            return this.array[this.array.length - 1];
    }

    /**
	 * Returns the sub path from the position of the given level.
	 * @param level - the start level.
	 * @return the sub path
	 */
    getSubPath(level:number) {
        if (level <= 0)
            return this;
        else if (this.array.length <= level)
            return TreePath.EMPTY;
        else {
            return new TreePath(this.array.slice(level))
        }
    }

    /**
	 * Sets the value of a given index.
	 * @param pIndex - the index.
	 * @param pValue - the value.
	 * @return the new TreePath.
	 */
    set(index:number, value:number) {
        const result = [...this.array]
        result[index] = value;
        return new TreePath(result);
    }

    /**
	 * Adds the given array to this TreePath
	 * @param pArray - the array.
	 * @return the new TreePath.
	 */
    getChildPath(...array:number[]) {
        if (array === null || array.length === 0)
            return this;
        else
            return new TreePath(this.array.concat(array))
    }

	/**
	 * Gets the parent tree path.
	 * @return the new TreePath.
	 */
    getParentPath() {
        if (this.array.length === 0)
            return this
        else if (this.array.length === 1)
            return TreePath.EMPTY;
        else
            return new TreePath(this.array.slice(0, this.array.length-1));
    }

    /**
	 * Returns true, if the given tree path is a parent path of this tree path.
	 * This means, that the tree path is either equal, or the given tree is a parent tree path of this tree path.
	 *
	 * @param pTreePath - the parent tree path.
	 * @return true, if the given tree path is a parent path of this tree path.
	 */
    containAsParent(treePath:TreePath) {
        if (treePath === null) 
            return true;
        else {
            if (this.array.length >= treePath.array.length) {
                for (let i = 0; i <= treePath.array.length; i++) {
                    if (this.array[i] !== treePath.array[i])
                        return false;
                }
                return true;
            }
            return false;
        }
    }

    /**
	 * Gets a mutable array of this immutable array. 
	 * @return a mutable array,
	 */
    toArray() {
        return [...this.array]
    }

    /**
     * Returns the last index of the parent
     * @returns 
     */
    getLastOfParent() {
        return this.getParentPath().getLast();
    }
}
export default TreePath