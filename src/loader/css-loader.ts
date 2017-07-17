import { Loader,LoaderOption } from './loader';
class CssLoader extends Loader {
    createDom(){
        var el = document.createElement('link');
        el.type = 'text/css';
        el.rel = 'stylesheet';
        this.el = el;
    }
    initResourceUrl() {
        this.el['href'] = this.tokenUrl();
    }
    private isUseCssLoadPatch(){
        var useCssLoadPatch = false;
        var ua = navigator.userAgent.toLowerCase();
        if (/iP(hone|od|ad)/.test(navigator.platform)) {
            let v = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
            let iOSVersion = parseFloat([parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)].join('.'));
            useCssLoadPatch = iOSVersion < 6;
        } else if (ua.indexOf("android") > -1) {
            // Android < 4.4
            let androidVersion = parseFloat(ua.slice(ua.indexOf("android") + 8));
            useCssLoadPatch = androidVersion < 4.4;
        } else if (ua.indexOf('safari') > -1) {
            let versionMatch = ua.match(/version\/([\.\d]+)/i);
            useCssLoadPatch = versionMatch && versionMatch[1] && parseFloat(versionMatch[1]) < 6;
        }
        return useCssLoadPatch;
    }
    private checkUseCssLoadPatch(){
        var _ = this;
        var el = this.el;
        var startTime = (new Date()).getTime();
        var timeout = _.option.timeout;
        if(this.isUseCssLoadPatch()){
            setTimeout(function checkLoad() {
                if(timeout && (new Date()).getTime() - startTime > timeout){
                    el.onerror(_.initTimeoutEvent());
                    return;
                }
                if(el.sheet && el.sheet.cssRules){
                    el.onload();
                }else{
                    checkLoad();
                }

            },20);
        }
    }
    load(){
        var result = super.load();
        this.checkUseCssLoadPatch();
        return result;
    }
}
export { CssLoader }