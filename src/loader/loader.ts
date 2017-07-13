function wrpperFn(fn) {
    return function () {
        fn.apply(this, arguments);
    }
}
interface LoaderOption{
    url:String;
}
class Loader {
    static loaders:Loader[] = [];
    static fileRule:RegExp = /.$/;
    static urlMatch = function (url) {
        return Loader.fileRule.test(url);
    };
    static findLoader = function (url) {
        var _loader = null;
        Loader.loaders.some(function (loader) {
            if(loader.urlMatch(url)){
                _loader = loader;
                return true;
            }
        });
        return _loader;
    };
    option:LoaderOption = {
        url:''
    };
    el = null;
    constructor(option?:LoaderOption) {
        if(option){
            Object.assign(this.option, option);
        }
        this.createDom();
    }
    appendToDom() {
    }
    createDom(){
    }
    initResourceUrl() {
        this.el.src = this.option.url;
    }

    load() {
        var el = this.el;
        var onloadFn, onErrorFn;
        var promise = new Promise(function (resolve, reject) {
            onloadFn = wrpperFn(resolve);
            onErrorFn = wrpperFn(reject);
        });
        el.onload = el['onreadystatechange'] = function (e) {
            var stateText = el['readyState'];
            if (stateText && !/^c|loade/.test(stateText)) return;
            el.onload = el['onreadystatechange'] = null;
            onloadFn.call(this, e);
        };
        el.onerror = onErrorFn;

        this.initResourceUrl();

        this.appendToDom();

        return promise;
    }
}

export { Loader,LoaderOption }