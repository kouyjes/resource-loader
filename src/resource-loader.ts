import { Loader,LoaderState } from './loader/loader';
import { JsLoader } from './loader/js-loader';
import { CssLoader } from './loader/css-loader';
import { ResourceUrl } from './loader/url-parser';
import { polyfill } from './polyfill';
polyfill();
interface ResourceLoaderOption {
    baseURI?:String;
    params?:Object
    useCache?:Boolean;
    timeout?:number;
}
/**
 * resource define
 * type: resource type can be js|css ...
 * urls: url list
 * serial: load type,load url serial when serial is true
 * dependence: resource this resource depend
 * timeout: every url load timeout in ms
 */
interface Resource {
    type:String;
    urls:String[];
    serial?:Boolean;
    dependence?:Resource;
    timeout?:number;
}
function isFunction(fn){
    return typeof fn === 'function';
}
var loaders = {
    js:JsLoader,
    css:CssLoader
};
loaders = Object.create(loaders);
class ResourceLoader {
    static loadStart:Function;
    static loadFinished:Function;
    static loadError:Function;
    static triggerLoadEvent(fn:Function){
        if(isFunction(fn)){
            fn();
        }
    }
    static registerLoader(type:String,loader:Loader){
        loaders[type] = loader;
        return ResourceLoader;
    };
    private option:ResourceLoaderOption = {};

    constructor(option?:ResourceLoaderOption) {
        if(option){
            Object.assign(this.option,option);
        }
    }
    private initTimeoutEvent(){
        var evt = document.createEvent('CustomEvent');
        evt.initEvent('timeout',false,false);
        return evt;
    }
    load(resource:Resource|Resource[],...other:Resource[]){

        var loadEvents = [];
        var loadFn = (resource:Resource|Resource[],...other:Resource[]) => {
            var promises = [];
            if(!(resource instanceof Array)){
                promises.push(this._loadResource(<Resource>resource,loadEvents));
            }else{
                (<Resource[]>resource).forEach((resource) => {
                    promises.push(this._loadResource(resource,loadEvents));
                });
            }
            var promise = Promise.all(promises);
            other.forEach((resource) => {
                promise = promise.then(() => {
                    var _resource = Object.create(resource);
                    return loadFn(_resource);
                });
            });
            return promise;
        };

        var params = arguments;
        return new Promise(function (resolve,reject) {
            ResourceLoader.triggerLoadEvent(ResourceLoader.loadStart)
            loadFn.apply(this,params).then(function () {
                resolve(loadEvents);
                ResourceLoader.triggerLoadEvent(ResourceLoader.loadFinished);
            }, function (result) {
                reject(result);
                ResourceLoader.triggerLoadEvent(ResourceLoader.loadError)
            });
        });

    }
    private _loadResource(resource:Resource,loadEvents:any[] = []){
        var timeout = this.option.timeout;
        var promise = this.__load(resource,loadEvents);
        if(!timeout){
            return promise;
        }
        return new Promise((resolve,reject) => {
            var isDirty = false;
            var timeoutId = setTimeout(function () {
                isDirty = true;
                reject(this.initTimeoutEvent());
            },timeout);
            promise.then(function (d) {
                clearTimeout(timeoutId);
                !isDirty && resolve(d);
            }, function (d) {
                clearTimeout(timeoutId);
                !isDirty && reject(d);
            });
        });
    }
    parseUrl(url:String){
        return ResourceUrl.parseUrl(this.option.baseURI,url);
    }
    private __load(resource:Resource,loadEvents:any[]){

        var promise;

        if(resource.dependence){
            promise = this.__load(resource.dependence,loadEvents);
        }

        var initiateLoader = (url) => {
            var _url = this.option.baseURI ? this.parseUrl(url) : url;
            var type = resource.type;
            if(type){
                type = type.toLowerCase();
            }
            var loaderFn = loaders[type];
            if(!loaderFn){
                throw new Error('resource type is not support !');
            }
            var loader = new loaderFn({
                url:_url,
                params:this.option.params,
                timeout:resource.timeout
            });
            return loader;
        }
        function loaderLoad(loader){
            return loader.load().then(function (result) {
                loadEvents.push(result);
            });
        }
        function initPromises(){
            var promises = [];
            if(resource.serial){
                resource.urls.forEach(function (url) {
                    var loader = initiateLoader(url);
                    if(promises.length > 0){
                        promises[0] = promises[0].then(function () {
                            return loaderLoad(loader);
                        });
                    }else{
                        promises.push(loaderLoad(loader));
                    }
                });
            }else{
                resource.urls.forEach(function (url) {
                    var loader = initiateLoader(url);
                    promises.push(loaderLoad(loader));
                });
            }
            return promises;
        }


        if(promise){
            promise = promise.then(function () {
                return Promise.all(initPromises());
            });
        }else{
            promise = Promise.all(initPromises());
        }
        return promise;
    }
}

export { ResourceLoader }