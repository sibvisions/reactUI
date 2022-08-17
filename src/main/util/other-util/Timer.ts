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

interface ITimer {
    fn: Function,
    ms: number,
    timerObj: number|null
    stop: Function,
    start: Function,
    reset: Function
}

// A Timer to do interval stuff
class Timer implements ITimer {
    fn:Function = () => {};
    ms:number = 0;
    timerObj:number|null = setInterval(this.fn, this.ms)

    constructor(fn:Function, ms:number) {
        this.fn = fn;
        this.ms = ms
        this.timerObj = setInterval(this.fn, this.ms);
    }

    // Stop the timer if it is running
    stop() {
        if (this.timerObj) {
            clearInterval(this.timerObj);
            this.timerObj = null;
        }
        return this;
    }

    // start timer using current settings (if it's not already running)
    start() {
        if (!this.timerObj) {
            this.stop();
            this.timerObj = setInterval(this.fn, this.ms);
        }
        return this;
    }

    // start with new or original interval, stop current interval
    reset(newT = this.ms) {
        this.ms = newT;
        return this.stop().start();
    }
}
export default Timer