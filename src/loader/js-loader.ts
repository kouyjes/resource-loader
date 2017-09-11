
import { ResourceUrl } from '../loader/url-parser';
import { RequestQueue,RequestQueueManager } from './request-queue';
import {ElementLoader} from "./element-loader";
const jsQueueManager = new RequestQueueManager();
class JsLoader extends ElementLoader {
    protected isExistEl(){
        var url = this.finalURL();
        url = ResourceUrl.parseUrl('',url);
        var scripts = Array.prototype.slice.call(document.getElementsByTagName('script'),0);
        return scripts.some(function (scr) {
            var src = scr.src;
            if(!src){
                return;
            }

            src = ResourceUrl.parseUrl('',src);
            if(src === url){
                return true;
            }
        });
    }
    protected appendToDom(el:HTMLElement) {
        document.head.appendChild(el);
    }
    protected createDom(){
        this.el = document.createElement('script');
        this.el.src = this.finalURL();
    }
    load(force = false):Promise{

        if(force){
            return this._load();
        }
        var url = this.finalURL();
        var request:RequestQueue = jsQueueManager.getQueue(url);

        var resolve = null,reject = null;
        var call = {
            resolve:resolve,
            reject:reject
        };
        var p = new Promise(function (_resolve, _reject) {
            call.resolve = resolve = _resolve;
            call.reject = reject = _reject;
        });

        if(!request){
            if(this.isExistEl()){
                resolve(this.createLoadEvent('success'));
                return p;
            }
            request = new RequestQueue({
                calls:[call]
            });
            jsQueueManager.putQueue(url,request);
        }else{
            if(request.status === 1){
                resolve(request.data);
            }else if(request.status === 2){
                reject(request.data);
            }else{
                request.calls.push(call);
            }
            return p;
        }
        this._load().then((result) => {
            jsQueueManager.executeQueue(url,'resolve',result);
        }, function (e) {
            jsQueueManager.executeQueue(url,'reject',e);
        });

        this.timeout(jsQueueManager,call);
        return p;
    }
    _load():Promise {
        var el = this.el;
        if(el){
            return super._load();
        }
        return super._load().then((d) => {
            if(el){
                el.parentNode.removeChild(el);
            }
            return d;
        });
    }

}
export { JsLoader }