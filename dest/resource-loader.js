(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.HERE = global.HERE || {})));
}(this, (function (exports) { 'use strict';

function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

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
    Loader.prototype.initTimeoutEvent = function () {
        var evt = document.createEvent('CustomEvent');
        evt.initEvent('timeout', false, false);
        return evt;
    };
    Loader.prototype.load = function () {
        var _ = this;
        var el = this.el;
        var onloadFn, onErrorFn;
        var promise = new Promise(function (resolve, reject) {
            onloadFn = wrpperFn(resolve);
            onErrorFn = wrpperFn(reject);
        });
        var timeout = this.option.timeout;
        var timeoutId;
        var isTimeout = false;
        el.onload = el['onreadystatechange'] = function (e) {
            var stateText = el['readyState'];
            if (stateText && !/^c|loade/.test(stateText))
                return;
            clearTimeout(timeoutId);
            el.onload = el['onreadystatechange'] = null;
            onloadFn.apply(this, arguments);
        };
        el.onerror = function () {
            el.onerror = null;
            clearTimeout(timeoutId);
            onErrorFn.apply(this, arguments);
        };
        this.initResourceUrl();
        this.appendToDom();
        timeoutId = timeout && setTimeout(function () {
            isTimeout = true;
            if (el.onerror) {
                el.onerror(_.initTimeoutEvent());
            }
        }, timeout);
        return promise;
    };
    return Loader;
}());

var JsLoader = (function (_super) {
    __extends(JsLoader, _super);
    function JsLoader() {
        _super.apply(this, arguments);
    }
    JsLoader.prototype.createDom = function () {
        this.el = document.createElement('script');
    };
    JsLoader.prototype.appendToDom = function () {
        document.head.appendChild(this.el);
    };
    return JsLoader;
}(Loader));

var CssLoader = (function (_super) {
    __extends(CssLoader, _super);
    function CssLoader() {
        _super.apply(this, arguments);
    }
    CssLoader.prototype.createDom = function () {
        var el = document.createElement('link');
        el.type = 'text/css';
        el.rel = 'stylesheet';
        this.el = el;
    };
    CssLoader.prototype.initResourceUrl = function () {
        this.el.href = this.option.url;
    };
    CssLoader.prototype.appendToDom = function () {
        document.head.appendChild(this.el);
    };
    CssLoader.prototype.isUseCssLoadPatch = function () {
        var useCssLoadPatch = false;
        var ua = navigator.userAgent.toLowerCase();
        if (/iP(hone|od|ad)/.test(navigator.platform)) {
            var v = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
            var iOSVersion = parseFloat([parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)].join('.'));
            useCssLoadPatch = iOSVersion < 6;
        }
        else if (ua.indexOf("android") > -1) {
            // Android < 4.4
            var androidVersion = parseFloat(ua.slice(ua.indexOf("android") + 8));
            useCssLoadPatch = androidVersion < 4.4;
        }
        else if (ua.indexOf('safari') > -1) {
            var versionMatch = ua.match(/version\/([\.\d]+)/i);
            useCssLoadPatch = versionMatch && versionMatch[1] && parseFloat(versionMatch[1]) < 6;
        }
        return useCssLoadPatch;
    };
    CssLoader.prototype.checkUseCssLoadPatch = function () {
        var _ = this;
        var el = this.el;
        var startTime = (new Date()).getTime();
        var timeout = _.option.timeout;
        if (this.isUseCssLoadPatch()) {
            setTimeout(function checkLoad() {
                if (timeout && (new Date()).getTime() - startTime > timeout) {
                    el.onerror(_.initTimeoutEvent());
                    return;
                }
                if (el.sheet && el.sheet.cssRules) {
                    el.onload();
                }
                else {
                    checkLoad();
                }
            }, 20);
        }
    };
    CssLoader.prototype.load = function () {
        var result = _super.prototype.load.call(this);
        this.checkUseCssLoadPatch();
        return result;
    };
    return CssLoader;
}(Loader));

var urlDom = document.createElement('a');
var ResourceUrl = (function () {
    function ResourceUrl() {
    }
    ResourceUrl.parseUrl = function (baseURI, url) {
        if (!baseURI) {
            baseURI = '';
        }
        if (!url) {
            url = '';
        }
        urlDom.href = url;
        if (urlDom.href === url || urlDom === url + '/') {
            return url;
        }
        urlDom.href = baseURI;
        var prefixUrl = urlDom.href;
        prefixUrl.replace(/\/+$/, '');
        url = url.replace(/^ \/+/, '');
        return prefixUrl + '/' + url;
    };
    return ResourceUrl;
}());

var loaders = {
    js: JsLoader,
    css: CssLoader
};
loaders = Object.create(loaders);
var ResourceLoader = (function () {
    function ResourceLoader(option) {
        this.loadedUrl = {};
        this.option = {};
        if (option) {
            Object.assign(this.option, option);
        }
    }
    ResourceLoader.registerLoader = function (type, loader) {
        loaders[type] = loader;
        return ResourceLoader;
    };
    ResourceLoader.prototype.initTimeoutEvent = function () {
        var evt = document.createEvent('CustomEvent');
        evt.initEvent('timeout', false, false);
        return evt;
    };
    ResourceLoader.prototype.load = function (resource) {
        var _ = this;
        var timeout = this.option.timeout;
        var promise = this._load(resource);
        if (!timeout) {
            return promise;
        }
        var isDirty = false;
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                isDirty = true;
                reject(_.initTimeoutEvent());
            }, timeout);
            promise.then(function (d) {
                !isDirty && resolve(d);
            }, function (d) {
                !isDirty && reject(d);
            });
        });
    };
    ResourceLoader.prototype._load = function (resource) {
        var _ = this;
        var promise;
        if (resource.dependence) {
            promise = _._load(resource.dependence);
        }
        function initiateLoader(url) {
            var type = resource.type;
            if (type) {
                type = type.toLowerCase();
            }
            var loaderFn = loaders[type];
            if (!loaderFn) {
                throw new Error('resource type is not support !');
            }
            var loader = new loaderFn({
                url: url,
                timeout: _.option.loaderTimeout
            });
            return loader;
        }
        function loadFinishFn(url) {
            return function () {
                _.loadedUrl[url] = true;
            };
        }
        function initPromises() {
            var promises = [];
            if (resource.serial) {
                resource.urls.forEach(function (url) {
                    url = _.option.baseURI ? ResourceUrl.parseUrl(_.option.baseURI, url) : url;
                    var loader = initiateLoader(url);
                    if (promises.length > 0) {
                        promises[0] = promises[0].then(function () {
                            return loader.load(loadFinishFn(url));
                        });
                    }
                    else {
                        promises.push(loader.load(loadFinishFn(url)));
                    }
                });
            }
            else {
                resource.urls.forEach(function (url) {
                    var loader = initiateLoader(url);
                    promises.push(loader.load(loadFinishFn(url)));
                });
            }
            return promises;
        }
        if (promise) {
            promise = promise.then(function () {
                return Promise.all(initPromises());
            });
        }
        else {
            promise = Promise.all(initPromises());
        }
        return promise;
    };
    return ResourceLoader;
}());

exports.Loader = Loader;
exports.JsLoader = JsLoader;
exports.CssLoader = CssLoader;
exports.ResourceLoader = ResourceLoader;

Object.defineProperty(exports, '__esModule', { value: true });

})));
