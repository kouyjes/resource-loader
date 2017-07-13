import { Loader } from './loader/loader';
import { JsLoader } from './loader/js-loader';
import { CssLoader } from './loader/css-loader';
interface ResourceLoaderOption {

}
interface Resource {
    url:String;
    fileNameAlias?:String;
    dependence?:Array<Resource>;
}
class ResourceLoader {
    loadedJsUrl:Object = {};
    loadedCssUrl:Object = {};
    option:ResourceLoaderOption = {};

    constructor(option) {

    }
    load(resources:Resource[]){
        var _ = this;
        var promises = [];
        resources.forEach(function (resource) {
            var promise;
            if(resource.dependence){
                promise = _.load(resource.dependence);
            }
            var loaderProvider = Loader.findLoader(resource.url);
            var loader = new loaderProvider({
                url:resource.url
            });
            if(promise){
                promise = promise.then(function () {
                    return loader.load();
                });
            }else{
                promise = loader.load();
            }
            return promise;
        });

        return Promise.all(promises);
    }
}

export { ResourceLoader }