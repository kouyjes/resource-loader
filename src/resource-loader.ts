import { Loader } from './loader/loader';
import { JsLoader } from './loader/js-loader';
import { CssLoader } from './loader/css-loader';
import { ResourceUrl } from './url-parser';
interface ResourceLoaderOption {
    baseURI?:String;
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
    }
    loadedUrl:Object = {};
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
        var timeout = this.option.timeout;
        var promise = this._load(resource);
        if(!timeout){
            return promise;
        }
        var isDirty = false;
        return new Promise(function (resolve,reject) {
            setTimeout(function () {
                isDirty = true;
                reject(_.initTimeoutEvent())
            },timeout);
            promise.then(function (d) {
                !isDirty && resolve(d);
            }, function (d) {
                !isDirty && reject(d);
            });
        });
    }
    _load(resource:Resource){
        var _ = this;

        var promise;

        if(resource.dependence){
            promise = _._load(resource.dependence);
        }

        function initiateLoader(url){
            var type = resource.type;
            if(type){
                type = type.toLowerCase();
            }
            var loaderFn = loaders[type];
            if(!loaderFn){
                throw new Error('resource type is not support !');
            }
            var loader = new loaderFn({
                url:url,
                timeout:_.option.loaderTimeout
            });
            return loader;
        }
        function loadFinishFn(url){
            return function () {
                _.loadedUrl[url] = true;
            }
        }

        function initPromises(){
            var promises = [];
            if(resource.serial){
                resource.urls.forEach(function (url) {
                    url = _.option.baseURI ? ResourceUrl.parseUrl(_.option.baseURI,url) : url;
                    var loader = initiateLoader(url);
                    if(promises.length > 0){
                        promises[0] = promises[0].then(function () {
                            return loader.load(loadFinishFn(url));
                        });
                    }else{
                        promises.push(loader.load(loadFinishFn(url)));
                    }
                });
            }else{
                resource.urls.forEach(function (url) {
                    var loader = initiateLoader(url);
                    promises.push(loader.load(loadFinishFn(url)));
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