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
var loaders = {
    js:JsLoader,
    css:CssLoader
};
loaders = Object.create(loaders);
class ResourceLoader {
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

        var promises = [];
        if(!(resource instanceof Array)){
            promises.push(this._loadResource(<Resource>resource));
        }else{
            (<Resource[]>resource).forEach((resource) => {
                promises.push(this._loadResource(resource));
            });
        }
        var promise = Promise.all(promises);
        other.forEach((resource) => {
            promise = promise.then(() => {
                return this.load(resource);
            });
        });
        return promise;
    }
    private _loadResource(resource:Resource){
        var timeout = this.option.timeout;
        var promise = this._load(resource);
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
    private _load(resource:Resource){

        var promise;

        if(resource.dependence){
            promise = this._load(resource.dependence);
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

        function initPromises(){
            var promises = [];
            if(resource.serial){
                resource.urls.forEach(function (url) {
                    var loader = initiateLoader(url);
                    if(promises.length > 0){
                        promises[0] = promises[0].then(function () {
                            return loader.load();
                        });
                    }else{
                        promises.push(loader.load());
                    }
                });
            }else{
                resource.urls.forEach(function (url) {
                    var loader = initiateLoader(url);
                    promises.push(loader.load());
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