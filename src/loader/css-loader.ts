import { Loader,LoaderOption } from './loader';
import { ResourceUrl } from '../loader/url-parser';
import { RequestQueue,RequestQueueManager } from './request-queue';
import {ElementLoader} from "./element-loader";
const cssQueueManager = new RequestQueueManager();
class CssLoader extends ElementLoader {
    protected isExistEl(){
        var url = this.finalURL();
        url = ResourceUrl.parseUrl('',url);
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
    protected appendToDom(el) {
        document.head.appendChild(el);
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
        if(!el){
            return;
        }
        var startTime = (new Date()).getTime();
        var timeout = this.option.timeout;
        if(this.isUseCssLoadPatch()){
            var checkLoad = () => {
                if(timeout && (new Date()).getTime() - startTime > timeout){
                    cssQueueManager.executeQueue(this.finalURL(),'reject',this.createLoadEvent('timeout'));
                    return;
                }
                if(el.sheet){
                    cssQueueManager.executeQueue(this.finalURL(),'resolve',this.createLoadEvent('success'));
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
    load(force = false):Promise{

        if(force){
            return this._load();
        }
        var url = this.finalURL();
        var request:RequestQueue = cssQueueManager.getQueue(url);

        var resolve = null,reject = null;
        var call = {
            resolve:resolve,
            reject:reject
        };
        var p = new Promise(function (_resolve, _reject) {
            call.resolve = resolve = _resolve;
            call.reject = reject = _reject;
        });

        var isExistEl = this.isExistEl();
        if(isExistEl){
            if(request){
                if(request.status === 1){
                    resolve(request.data);
                }else if(request.status === 2){
                    reject(request.data);
                }else{
                    request.calls.push(call);
                }
            }else{
                resolve(this.createLoadEvent('success'));
            }
            return p;
        }else{
            if(!request){
                request = new RequestQueue();
                cssQueueManager.putQueue(url,request);
            }else{
                request.status = 0;
            }
            request.calls.push(call);
        }
        this._load().then((result) => {
            if(this.isExistEl()){
                cssQueueManager.executeQueue(url,'resolve',result);
            }
        }, (e) => {
            if(this.isExistEl()){
                cssQueueManager.executeQueue(url,'reject',e);
            }
        });

        this.timeout(cssQueueManager,call);

        return p;
    }
}
export { CssLoader }