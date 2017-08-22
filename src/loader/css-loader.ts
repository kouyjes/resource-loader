import { Loader,LoaderOption,LoaderState } from './loader';
import { ResourceUrl } from '../loader/url-parser';
class CssLoader extends Loader {
    protected isExistEl(){
        var url = this.finalURL();
        var links = Array.prototype.slice.call(document.getElementsByTagName('link'),0);

        return links.some(function (lnk) {
            var href = lnk.href;
            if(!href){
                return;
            }

            href = ResourceUrl.parseUrl('',href);
            if(href === url){
                return true;
            }
        });

    }
    protected createDom(){
        this.el = document.createElement('link');
        this.el.type = 'text/css';
        this.el.rel = 'stylesheet';
        this.el['href'] = this.finalURL();
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
        var el = this.el;
        var startTime = (new Date()).getTime();
        var timeout = this.option.timeout;
        if(this.isUseCssLoadPatch()){
            var checkLoad = () => {
                if(timeout && (new Date()).getTime() - startTime > timeout){
                    el.onerror(this.initTimeoutEvent());
                    return;
                }
                if(el.sheet){
                    el.onload(this.createLoadEvent('success'));
                }else{
                    setTimeout(checkLoad ,20);
                }

            };
            checkLoad();
        }
    }
    load():Promise{
        var result = super.load();
        this.checkUseCssLoadPatch();
        return result;
    }
}
export { CssLoader }