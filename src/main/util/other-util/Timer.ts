interface ITimer {
    fn: Function,
    ms: number,
    timerObj: number|null
    stop: Function,
    start: Function,
    reset: Function
}

class Timer implements ITimer {
    fn:Function = () => {};
    ms:number = 0;
    timerObj:number|null = setInterval(this.fn, this.ms)

    constructor(fn:Function, ms:number) {
        this.fn = fn;
        this.ms = ms
        this.timerObj = setInterval(this.fn, this.ms);
    }

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