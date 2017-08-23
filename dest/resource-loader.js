/* Resource loader */
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

function wrapperFn(fn) {
    return function () {
        fn.apply(this, arguments);
    };
}
var nextId = (function () {
    var id = 1;
    return function () {
        return id++;
    };
})();
/**
 * base abstract class loader
 */
var RequestCache = {};
var Loader = (function () {
    function Loader(option) {
        this.option = {
            url: ''
        };
        this.timestamp = nextId();
        this.el = null;
        if (option) {
            Object.assign(this.option, option);
        }
    }
    Loader.prototype.appendToDom = function () {
        document.head.appendChild(this.el);
    };
    Loader.prototype.isExistEl = function () { };
    
    Loader.prototype.createDom = function () { };
    Loader.prototype.finalURL = function () {
        var url = this.option.url;
        var params = Loader.GlobalParam || {};
        var userParams = this.option.params;
        if (!userParams) {
            Object.assign(params, userParams);
        }
        var queryArray = Array();
        var keys = Object.keys(params);
        keys.sort(function (v1, v2) {
            if (v1 > v2) {
                return 1;
            }
            else if (v1 < v2) {
                return -1;
            }
            return 0;
        });
        keys.forEach(function (name) {
            var value = params[name];
            if (value) {
                queryArray.push(name + '=' + value);
            }
        });
        if (queryArray.length === 0) {
            return url;
        }
        var queryString = queryArray.join('&');
        if (this.option.url.indexOf('?') === -1) {
            queryString = '?' + queryString;
        }
        url = url + queryString;
        return url;
    };
    Loader.prototype.createLoadEvent = function (state) {
        if (state === void 0) { state = 'success'; }
        return {
            state: state,
            url: this.finalURL(),
            target: this.el
        };
    };
    Loader.prototype.load = function (force) {
        var _this = this;
        if (force === void 0) { force = false; }
        if (force) {
            return this._load();
        }
        var url = this.finalURL();
        var request = RequestCache[url];
        var resolve = null, reject = null;
        var p = new Promise(function (_resolve, _reject) {
            resolve = _resolve;
            reject = _reject;
        });
        var call = {
            resolve: resolve,
            reject: reject
        };
        if (!request) {
            if (this.isExistEl()) {
                resolve(this.createLoadEvent('success'));
                return p;
            }
            RequestCache[url] = {
                status: 0,
                calls: [call]
            };
        }
        else {
            if (request.status === 1) {
                resolve(request.data);
            }
            else if (request.status === 2) {
                reject(request.data);
            }
            else {
                request.calls.push(call);
            }
            return p;
        }
        function executeCalls(calls, type, data) {
            calls.forEach(function (call) {
                var fn = call[type];
                try {
                    fn(data);
                }
                catch (e) {
                    console.error(e);
                }
            });
            calls.length = 0;
        }
        this._load().then(function (result) {
            var req = RequestCache[url];
            req.data = result;
            req.status = 1;
            executeCalls(req.calls, 'resolve', result);
        }, function (e) {
            var req = RequestCache[url];
            req.data = e;
            req.status = 2;
            console.error(e);
            executeCalls(req.calls, 'reject', e);
        });
        if (typeof this.option.timeout === 'number') {
            setTimeout(function () {
                var req = RequestCache[url];
                var index = req.calls.indexOf(call);
                if (index >= 0) {
                    req.calls.splice(index, 1);
                    call.reject(_this.createLoadEvent('timeout'));
                }
            }, this.option.timeout);
        }
        return p;
    };
    /**
     * start load
     * @returns {Promise<T>}
     */
    Loader.prototype._load = function () {
        var _this = this;
        this.createDom();
        var el = this.el;
        var onLoadFn, onErrorFn;
        var promise = new Promise(function (resolve, reject) {
            onLoadFn = wrapperFn(resolve);
            onErrorFn = wrapperFn(reject);
        });
        el.onload = el['onreadystatechange'] = function () {
            var stateText = el['readyState'];
            if (stateText && !/^c|loade/.test(stateText))
                return;
            onLoadFn(_this.createLoadEvent('success'));
        };
        el.onerror = function () {
            var comment = document.createComment('Loader load error, Url: ' + _this.option.url + ' ,loadTime:' + (new Date()));
            if (el.parentNode) {
                el.parentNode.replaceChild(comment, el);
            }
            else {
                document.head.appendChild(comment);
            }
            onErrorFn(_this.createLoadEvent('error'));
        };
        this.appendToDom();
        return promise;
    };
    Loader.GlobalParam = {};
    return Loader;
}());

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
        if (url.startsWith('/')) {
            return urlDom.href;
        }
        if (urlDom.href === url || urlDom.href === url + '/') {
            return url;
        }
        urlDom.href = baseURI;
        var prefixUrl = urlDom.href;
        prefixUrl = prefixUrl.replace(/\/+$/, '');
        url = url.replace(/^\/+/, '');
        return prefixUrl + '/' + url;
    };
    return ResourceUrl;
}());

var JsLoader = (function (_super) {
    __extends(JsLoader, _super);
    function JsLoader() {
        _super.apply(this, arguments);
    }
    JsLoader.prototype.isExistEl = function () {
        var url = this.finalURL();
        var scripts = Array.prototype.slice.call(document.getElementsByTagName('script'), 0);
        return scripts.some(function (scr) {
            var src = scr.src;
            if (!src) {
                return;
            }
            src = ResourceUrl.parseUrl('', src);
            if (src === url) {
                return true;
            }
        });
    };
    JsLoader.prototype.createDom = function () {
        this.el = document.createElement('script');
        this.el.src = this.finalURL();
    };
    return JsLoader;
}(Loader));

var CssLoader = (function (_super) {
    __extends(CssLoader, _super);
    function CssLoader() {
        _super.apply(this, arguments);
    }
    CssLoader.prototype.isExistEl = function () {
        var url = this.finalURL();
        var links = Array.prototype.slice.call(document.getElementsByTagName('link'), 0);
        return links.some(function (lnk) {
            var href = lnk.href;
            if (!href) {
                return;
            }
            href = ResourceUrl.parseUrl('', href);
            if (href === url) {
                return true;
            }
        });
    };
    CssLoader.prototype.createDom = function () {
        this.el = document.createElement('link');
        this.el.type = 'text/css';
        this.el.rel = 'stylesheet';
        this.el['href'] = this.finalURL();
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
        var _this = this;
        var el = this.el;
        var startTime = (new Date()).getTime();
        var timeout = this.option.timeout;
        if (this.isUseCssLoadPatch()) {
            var checkLoad = function () {
                if (timeout && (new Date()).getTime() - startTime > timeout) {
                    el.onerror(_this.initTimeoutEvent());
                    return;
                }
                if (el.sheet) {
                    el.onload(_this.createLoadEvent('success'));
                }
                else {
                    setTimeout(checkLoad, 20);
                }
            };
            checkLoad();
        }
    };
    CssLoader.prototype.load = function () {
        var result = _super.prototype.load.call(this);
        this.checkUseCssLoadPatch();
        return result;
    };
    return CssLoader;
}(Loader));

function polyfill() {
    if (!Object.assign) {
        Object.assign = function (src, target) {
            if (!target) {
                return src;
            }
            Object.keys(target).forEach(function (key) {
                src[key] = target[key];
            });
            return src;
        };
    }
}

polyfill();
function isFunction(fn) {
    return typeof fn === 'function';
}
var loaders = {
    js: JsLoader,
    css: CssLoader
};
loaders = Object.create(loaders);
var LoaderEvent;
(function (LoaderEvent) {
    LoaderEvent[LoaderEvent["LoadStart"] = 'loadStart'] = "LoadStart";
    LoaderEvent[LoaderEvent["LoadFinished"] = 'loadFinished'] = "LoadFinished";
    LoaderEvent[LoaderEvent["LoadError"] = 'loadError'] = "LoadError";
})(LoaderEvent || (LoaderEvent = {}));
var ResourceLoader = (function () {
    function ResourceLoader(option) {
        this.option = {};
        if (option) {
            Object.assign(this.option, option);
        }
    }
    ResourceLoader.triggerLoadEvent = function (eventType, target) {
        var listeners = ResourceLoader.loadEventListener[eventType];
        listeners && listeners.forEach(function (fn) {
            try {
                fn(target);
            }
            catch (e) {
                console.error(e);
            }
        });
    };
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
        var _this = this;
        var other = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            other[_i - 1] = arguments[_i];
        }
        var loadEvents = [];
        var loadFn = function (resource) {
            var other = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                other[_i - 1] = arguments[_i];
            }
            var promises = [];
            if (!(resource instanceof Array)) {
                promises.push(_this._loadResource(resource, loadEvents));
            }
            else {
                resource.forEach(function (resource) {
                    promises.push(_this._loadResource(resource, loadEvents));
                });
            }
            var promise = Promise.all(promises);
            other.forEach(function (resource) {
                promise = promise.then(function () {
                    var _resource = Object.create(resource);
                    return loadFn(_resource);
                });
            });
            return promise;
        };
        var params = arguments;
        return new Promise(function (resolve, reject) {
            loadFn.apply(this, params).then(function () {
                resolve(loadEvents);
            }, function (result) {
                reject(result);
            });
        });
    };
    ResourceLoader.prototype._loadResource = function (resource, loadEvents) {
        if (loadEvents === void 0) { loadEvents = []; }
        var timeout = this.option.timeout;
        var promise = this.__load(resource, loadEvents);
        if (!timeout) {
            return promise;
        }
        return new Promise(function (resolve, reject) {
            var isDirty = false;
            var timeoutId = setTimeout(function () {
                isDirty = true;
                reject(this.initTimeoutEvent());
            }, timeout);
            promise.then(function (d) {
                clearTimeout(timeoutId);
                !isDirty && resolve(d);
            }, function (d) {
                clearTimeout(timeoutId);
                !isDirty && reject(d);
            });
        });
    };
    ResourceLoader.prototype.parseUrl = function (url) {
        if (!this.option.baseURI) {
            return url;
        }
        return ResourceUrl.parseUrl(this.option.baseURI, url);
    };
    ResourceLoader.prototype.__load = function (resource, loadEvents) {
        var _this = this;
        var promise;
        if (resource.dependence) {
            promise = this.__load(resource.dependence, loadEvents);
        }
        var initiateLoader = function (url) {
            var _url = _this.parseUrl(url);
            var type = resource.type;
            if (type) {
                type = type.toLowerCase();
            }
            var loaderFn = loaders[type];
            if (!loaderFn) {
                throw new Error('resource type is not support !');
            }
            var loader = new loaderFn({
                url: _url,
                params: _this.option.params,
                timeout: resource.timeout
            });
            return loader;
        };
        function loaderLoad(loader) {
            var target = {
                url: loader.finalURL()
            };
            return new Promise(function (resolve, reject) {
                ResourceLoader.triggerLoadEvent(LoaderEvent.LoadStart, target);
                loader.load().then(function (result) {
                    loadEvents.push(result);
                    resolve(result);
                    ResourceLoader.triggerLoadEvent(LoaderEvent.LoadFinished, target);
                }, function (result) {
                    reject(result);
                    ResourceLoader.triggerLoadEvent(LoaderEvent.LoadError, target);
                });
            });
        }
        function initPromises() {
            var promises = [];
            if (resource.serial) {
                resource.urls.forEach(function (url) {
                    var loader = initiateLoader(url);
                    if (promises.length > 0) {
                        promises[0] = promises[0].then(function () {
                            return loaderLoad(loader);
                        });
                    }
                    else {
                        promises.push(loaderLoad(loader));
                    }
                });
            }
            else {
                resource.urls.forEach(function (url) {
                    var loader = initiateLoader(url);
                    promises.push(loaderLoad(loader));
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
    ResourceLoader.loadEventListener = {};
    ResourceLoader.addEventListener = function (eventType, handler) {
        var listeners = ResourceLoader.loadEventListener[eventType] || [];
        if (isFunction(handler) && listeners.indexOf(handler) === -1) {
            listeners.push(handler);
            ResourceLoader.loadEventListener[eventType] = listeners;
        }
    };
    ResourceLoader.removeEventListener = function (eventType, handler) {
        var listeners = ResourceLoader.loadEventListener[eventType] || [];
        var index = listeners.indexOf(handler);
        if (index >= 0) {
            listeners.splice(index, 1);
        }
    };
    ResourceLoader.load = function (resource) {
        var other = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            other[_i - 1] = arguments[_i];
        }
        var loader = new ResourceLoader();
        return loader.load.apply(loader, arguments);
    };
    return ResourceLoader;
}());

exports.Loader = Loader;
exports.JsLoader = JsLoader;
exports.CssLoader = CssLoader;
exports.ResourceLoader = ResourceLoader;
exports.ResourceUrl = ResourceUrl;

Object.defineProperty(exports, '__esModule', { value: true });

})));
