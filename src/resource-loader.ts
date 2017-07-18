import { Loader,LoaderState } from './loader/loader';
import { JsLoader } from './loader/js-loader';
import { CssLoader } from './loader/css-loader';
import { ResourceUrl } from './loader/url-parser';
import { polyfill } from './polyfill';
polyfill();
interface ResourceLoaderOption {
    baseURI?:String;
    token?:String|number
    useCache?:Boolean;
    loaderTimeout?:number;
    timeout?:number;
}
interface Resource {
    type:String;
    urls:String[];
    serial?:Boolean;
    dependence?:Resource;
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
    option:ResourceLoaderOption = {

    };

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
    load(resource:Resource){
        var _ = this;
        try{
            var timeout = this.option.timeout;
            var promise = this._load(resource);
            if(!timeout){
                return promise;
            }
            var isDirty = false;
            return new Promise(function (resolve,reject) {
                setTimeout(function () {
                    isDirty = true;
                    reject(_.initTimeoutEvent());
                },timeout);
                promise.then(function (d) {
                    !isDirty && resolve(d);
                }, function (d) {
                    !isDirty && reject(d);
                });
            });
        }finally {
        }
    }
    _load(resource:Resource){

        var _ = this;

        var promise;

        if(resource.dependence){
            promise = _._load(resource.dependence);
        }

        function initiateLoader(url){
            var _url = _.option.baseURI ? ResourceUrl.parseUrl(_.option.baseURI,url) : url;
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
                token:_.option.token,
                timeout:_.option.loaderTimeout
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