export class Logger {
    private static prefix = "[keyboard-tab-switcher]";
    static log(...data: any) {
        console.log(this.prefix, ...data);
    }
    static warn(...data: any) {
        console.warn(this.prefix, ...data);
    }
    static error(...data: any) {
        console.error(this.prefix, ...data);
    }
}
