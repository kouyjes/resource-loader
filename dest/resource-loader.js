(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.HERE = global.HERE || {})));
}(this, (function (exports) { 'use strict';

function wrpperFn(fn) {
    return function () {
        fn.apply(this, arguments);
    };
}
var Loader = (function () {
    function Loader(option) {
        this.option = {
            url: ''
        };
        this.el = null;
        if (option) {
            Object.assign(this.option, option);
        }
        this.createDom();
    }
    Loader.prototype.appendToDom = function () {
    };
    Loader.prototype.createDom = function () {
    };
    Loader.prototype.initResourceUrl = function () {
        this.el.src = this.option.url;
    };
    Loader.prototype.load = function () {
        var el = this.el;
        var onloadFn, onErrorFn;
        var promise = new Promise(function (resolve, reject) {
            onloadFn = wrpperFn(resolve);
            onErrorFn = wrpperFn(reject);
        });
        el.onload = el['onreadystatechange'] = function (e) {
            var stateText = el['readyState'];
            if (stateText && !/^c|loade/.test(stateText))
                return;
            el.onload = el['onreadystatechange'] = null;
            onloadFn.call(this, e);
        };
        el.onerror = onErrorFn;
        this.initResourceUrl();
        this.appendToDom();
        return promise;
    };
    Loader.loaders = [];
    Loader.fileRule = /.$/;
    Loader.urlMatch = function (url) {
        return Loader.fileRule.test(url);
    };
    Loader.findLoader = function (url) {
        var _loader = null;
        Loader.loaders.some(function (loader) {
            if (loader.urlMatch(url)) {
                _loader = loader;
                return true;
            }
        });
        return _loader;
    };
    return Loader;
}());

var ResourceLoader = (function () {
    function ResourceLoader(option) {
        this.loadedJsUrl = {};
        this.loadedCssUrl = {};
        this.option = {};
    }
    ResourceLoader.prototype.load = function (resources) {
        var _ = this;
        var promises = [];
        resources.forEach(function (resource) {
            var promise;
            if (resource.dependence) {
                promise = _.load(resource.dependence);
            }
            var loaderProvider = Loader.findLoader(resource.url);
            var loader = new loaderProvider({
                url: resource.url
            });
            if (promise) {
                promise = promise.then(function () {
                    return loader.load();
                });
            }
            else {
                promise = loader.load();
            }
            return promise;
        });
        return Promise.all(promises);
    };
    return ResourceLoader;
}());

exports.ResourceLoader = ResourceLoader;

Object.defineProperty(exports, '__esModule', { value: true });

})));
