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

var LoaderEnvModel;
(function (LoaderEnvModel) {
    LoaderEnvModel[LoaderEnvModel["PRODUCT"] = 'product'] = "PRODUCT";
    LoaderEnvModel[LoaderEnvModel["DEVELOP"] = 'develop'] = "DEVELOP";
})(LoaderEnvModel || (LoaderEnvModel = {}));
var nextId = (function () {
    var id = 1;
    return function () {
        return id++;
    };
})();
/**
 * base abstract class loader
 */
var Loader = (function () {
    function Loader(option) {
        this.option = {
            url: ''
        };
        this.timestamp = nextId();
        if (option) {
            Object.assign(this.option, option);
        }
    }
    Loader.prototype.finalURL = function () {
        var url = this.option.url;
        var params = Object.assign({}, Loader.GlobalParam);
        var userParams = this.option.params;
        if (userParams) {
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
        else if (!url.endsWith('&')) {
            queryString = '&' + queryString;
        }
        url = url + queryString;
        return url;
    };
    Loader.prototype.createLoadEvent = function (state) {
        if (state === void 0) { state = 'success'; }
        return {
            state: state,
            url: this.finalURL()
        };
    };
    Loader.prototype.timeout = function (queueManager, call) {
        var _this = this;
        if (typeof this.option.timeout === 'number') {
            setTimeout(function () {
                var req = queueManager.getQueue(_this.finalURL());
                if (!req) {
                    return;
                }
                var index = req.calls.indexOf(call);
                if (index >= 0) {
                    req.calls.splice(index, 1);
                    call.reject(_this.createLoadEvent('timeout'));
                }
            }, this.option.timeout);
        }
    };
    Loader.ENV_MODE = LoaderEnvModel.PRODUCT;
    Loader.GlobalParam = {};
    return Loader;
}());

var urlDom;
var ResourceUrl = (function () {
    function ResourceUrl() {
    }
    ResourceUrl.parseUrl = function (baseURI, url) {
        if (!url) {
            url = '';
        }
        if (!urlDom) {
            urlDom = document.createElement('a');
        }
        urlDom.href = url;
        if (!baseURI) {
            return urlDom.href;
        }
        if (url.match(/^\//)) {
            return urlDom.href;
        }
        urlDom.href = url;
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

var RequestQueueManager = (function () {
    function RequestQueueManager() {
        Object.defineProperty(this, 'requestQueues', {
            value: {}
        });
    }
    RequestQueueManager.prototype.executeQueue = function (key, type, data) {
        var request = this.requestQueues[key];
        if (!request) {
            return;
        }
        request.execute(type, data);
    };
    RequestQueueManager.prototype.putQueue = function (key, request) {
        this.requestQueues[key] = request;
    };
    RequestQueueManager.prototype.getQueue = function (key) {
        return this.requestQueues[key] || null;
    };
    RequestQueueManager.prototype.removeQueue = function (key) {
        var queue = this.requestQueues[key];
        delete this.requestQueues[key];
        return queue;
    };
    return RequestQueueManager;
}());
var RequestQueue = (function () {
    function RequestQueue(option) {
        if (option === void 0) { option = {}; }
        this.status = 0;
        this.data = null;
        this.calls = [];
        if (option.status) {
            this.status = option.status;
        }
        if (option.data) {
            this.data = option.data;
        }
        if (option.calls) {
            this.calls = option.calls;
        }
    }
    RequestQueue.prototype.execute = function (type, data) {
        this.data = data;
        if (type === 'resolve') {
            this.status = 1;
        }
        else if (type === 'reject') {
            this.status = 2;
            console.error(data);
        }
        this.calls.forEach(function (call) {
            var fn = call[type];
            try {
                fn(data);
            }
            catch (e) {
                console.error(e);
            }
        });
        this.calls.length = 0;
    };
    return RequestQueue;
}());

function wrapperFn(fn) {
    return function () {
        fn.apply(this, arguments);
    };
}
/**
 * base abstract class loader
 */
var ElementLoader = (function (_super) {
    __extends(ElementLoader, _super);
    function ElementLoader(option) {
        _super.call(this, option);
        this.el = null;
    }
    ElementLoader.prototype.isExistEl = function () {
        return false;
    };
    
    ElementLoader.prototype.createLoadEvent = function (state) {
        if (state === void 0) { state = 'success'; }
        return {
            state: state,
            url: this.finalURL(),
            target: this.el
        };
    };
    ElementLoader.prototype.appendAttributes = function (el) {
        if (!el) {
            return;
        }
        var attributes = this.option.attributes || {};
        Object.keys(attributes).forEach(function (key) {
            if (typeof key !== 'string') {
                return;
            }
            var value = attributes[key];
            if (['number', 'boolean', 'string'].indexOf(typeof value) >= 0) {
                el.setAttribute(key, String(value));
            }
        });
    };
    ElementLoader.prototype.load = function () {
        return this._load();
    };
    /**
     * start load
     * @returns {Promise<T>}
     */
    ElementLoader.prototype._load = function () {
        var _this = this;
        this.createDom();
        var el = this.el;
        this.appendAttributes(el);
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
            el.onload = el['onreadystatechange'] = null;
        };
        el.onerror = function () {
            var comment = document.createComment('Loader load error, Url: ' + _this.option.url + ' ,loadTime:' + (new Date()));
            if (el.parentNode) {
                el.parentNode.replaceChild(comment, el);
            }
            onErrorFn(_this.createLoadEvent('error'));
        };
        this.appendToDom(el);
        return promise;
    };
    return ElementLoader;
}(Loader));

var jsQueueManager = new RequestQueueManager();
var JsLoader = (function (_super) {
    __extends(JsLoader, _super);
    function JsLoader() {
        _super.apply(this, arguments);
    }
    JsLoader.prototype.isExistEl = function () {
        var url = this.finalURL();
        url = ResourceUrl.parseUrl('', url);
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
    JsLoader.prototype.appendToDom = function (el) {
        document.head.appendChild(el);
    };
    JsLoader.prototype.createDom = function () {
        var el = document.createElement('script');
        el.src = this.finalURL();
        this.el = el;
    };
    JsLoader.prototype.load = function (force) {
        if (force === void 0) { force = false; }
        if (force) {
            return this._load();
        }
        var url = this.finalURL();
        var request = jsQueueManager.getQueue(url);
        var resolve = null, reject = null;
        var call = {
            resolve: resolve,
            reject: reject
        };
        var p = new Promise(function (_resolve, _reject) {
            call.resolve = resolve = _resolve;
            call.reject = reject = _reject;
        });
        if (!request) {
            if (this.isExistEl()) {
                resolve(this.createLoadEvent('success'));
                return p;
            }
            request = new RequestQueue({
                calls: [call]
            });
            jsQueueManager.putQueue(url, request);
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
        this._load().then(function (result) {
            jsQueueManager.executeQueue(url, 'resolve', result);
        }, function (e) {
            jsQueueManager.executeQueue(url, 'reject', e);
        });
        this.timeout(jsQueueManager, call);
        return p;
    };
    JsLoader.prototype._load = function () {
        var _this = this;
        return _super.prototype._load.call(this).then(function (d) {
            if (Loader.ENV_MODE === LoaderEnvModel.PRODUCT && _this.el) {
                try {
                    _this.el.parentNode.removeChild(_this.el);
                }
                catch (e) {
                }
            }
            return d;
        });
    };
    return JsLoader;
}(ElementLoader));

var cssQueueManager = new RequestQueueManager();
var CssLoader = (function (_super) {
    __extends(CssLoader, _super);
    function CssLoader() {
        _super.apply(this, arguments);
    }
    CssLoader.prototype.isExistEl = function () {
        var url = this.finalURL();
        url = ResourceUrl.parseUrl('', url);
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
    CssLoader.prototype.appendToDom = function (el) {
        document.head.appendChild(el);
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
        if (!el) {
            return;
        }
        var startTime = (new Date()).getTime();
        var timeout = this.option.timeout;
        if (this.isUseCssLoadPatch()) {
            var checkLoad = function () {
                if (timeout && (new Date()).getTime() - startTime > timeout) {
                    cssQueueManager.executeQueue(_this.finalURL(), 'reject', _this.createLoadEvent('timeout'));
                    return;
                }
                if (el.sheet) {
                    cssQueueManager.executeQueue(_this.finalURL(), 'resolve', _this.createLoadEvent('success'));
                }
                else {
                    setTimeout(checkLoad, 20);
                }
            };
            checkLoad();
        }
    };
    CssLoader.prototype._load = function () {
        var result = _super.prototype._load.call(this);
        this.checkUseCssLoadPatch();
        return result;
    };
    CssLoader.prototype.load = function (force) {
        var _this = this;
        if (force === void 0) { force = false; }
        if (force) {
            return this._load();
        }
        var url = this.finalURL();
        var request = cssQueueManager.getQueue(url);
        var resolve = null, reject = null;
        var call = {
            resolve: resolve,
            reject: reject
        };
        var p = new Promise(function (_resolve, _reject) {
            call.resolve = resolve = _resolve;
            call.reject = reject = _reject;
        });
        var isExistEl = this.isExistEl();
        if (isExistEl) {
            if (request) {
                if (request.status === 1) {
                    resolve(request.data);
                }
                else if (request.status === 2) {
                    reject(request.data);
                }
                else {
                    request.calls.push(call);
                }
            }
            else {
                resolve(this.createLoadEvent('success'));
            }
            return p;
        }
        else {
            if (!request) {
                request = new RequestQueue();
                cssQueueManager.putQueue(url, request);
            }
            else {
                request.status = 0;
            }
            request.calls.push(call);
        }
        this._load().then(function (result) {
            if (_this.isExistEl()) {
                cssQueueManager.executeQueue(url, 'resolve', result);
            }
        }, function (e) {
            if (_this.isExistEl()) {
                cssQueueManager.executeQueue(url, 'reject', e);
            }
        });
        this.timeout(cssQueueManager, call);
        return p;
    };
    return CssLoader;
}(ElementLoader));

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

var textQueueManager = new RequestQueueManager();
var TextLoader = (function (_super) {
    __extends(TextLoader, _super);
    function TextLoader() {
        _super.apply(this, arguments);
    }
    TextLoader.prototype.load = function () {
        var resolve = null, reject = null;
        var call = {
            resolve: null,
            reject: null
        };
        var promise = new Promise(function (_resolve, _reject) {
            call.resolve = resolve = _resolve;
            call.reject = reject = _reject;
        });
        var url = this.finalURL();
        var request = textQueueManager.getQueue(url);
        if (!request) {
            request = new RequestQueue({
                calls: [call]
            });
            textQueueManager.putQueue(url, request);
        }
        else {
            if (request.status === 0) {
                request.calls.push(call);
                return promise;
            }
        }
        this._load().then(function (result) {
            textQueueManager.executeQueue(url, 'resolve', result);
            textQueueManager.removeQueue(url);
        }, function (e) {
            textQueueManager.executeQueue(url, 'reject', e);
            textQueueManager.removeQueue(url);
        });
        this.timeout(textQueueManager, call);
        return promise;
    };
    TextLoader.prototype._load = function () {
        var _this = this;
        var url = this.finalURL();
        var resolve, reject;
        var promise = new Promise(function (_resolve, _reject) {
            resolve = _resolve;
            reject = _reject;
        });
        var xhr = new XMLHttpRequest();
        try {
            xhr.open('GET', url, true);
            xhr['onreadystatechange'] = function () {
                if (xhr.readyState !== 4) {
                    return;
                }
                var status = xhr.status;
                var isSuccess = status >= 200 && status < 300 || status === 304;
                if (isSuccess) {
                    resolve(xhr.responseText);
                }
                else {
                    reject(_this.createLoadEvent('error'));
                }
            };
            xhr.send();
        }
        catch (e) {
            console.error(e);
            reject && reject(this.createLoadEvent('error'));
        }
        return promise;
    };
    return TextLoader;
}(Loader));

var JsonLoader = (function (_super) {
    __extends(JsonLoader, _super);
    function JsonLoader(option) {
        _super.call(this, option);
    }
    JsonLoader.prototype.load = function () {
        return _super.prototype.load.call(this).then(function (data) {
            return JSON.parse(data);
        });
    };
    return JsonLoader;
}(TextLoader));

var ImageLoader = (function (_super) {
    __extends(ImageLoader, _super);
    function ImageLoader(option) {
        _super.call(this, option);
    }
    ImageLoader.prototype.appendToDom = function (el) {
    };
    ImageLoader.prototype.createDom = function () {
        this.el = document.createElement('img');
        this.el.src = this.finalURL();
    };
    return ImageLoader;
}(ElementLoader));

polyfill();
function isFunction(fn) {
    return typeof fn === 'function';
}
var loaders = {
    js: JsLoader,
    css: CssLoader,
    text: TextLoader,
    json: JsonLoader,
    image: ImageLoader
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
            if (resource) {
                if (!(resource instanceof Array)) {
                    promises.push(_this._loadResource(resource, loadEvents));
                }
                else {
                    resource.forEach(function (resource) {
                        promises.push(_this._loadResource(resource, loadEvents));
                    });
                }
            }
            var promise = Promise.all(promises);
            other.forEach(function (resource) {
                if (!resource) {
                    return;
                }
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
        return ResourceUrl.parseUrl(this.option.baseURI, url);
    };
    ResourceLoader.prototype.__load = function (resource, loadEvents) {
        var _this = this;
        var promise;
        if (resource.dependence) {
            if (resource.dependence instanceof Array) {
                promise = Promise.all(resource.dependence.map(function (dependence) {
                    return this.__load(dependence, loadEvents);
                }.bind(this)));
            }
            else {
                promise = this.__load(resource.dependence, loadEvents);
            }
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
            var params = Object.assign({}, _this.option.params);
            Object.assign(params, resource.params);
            var loader = new loaderFn({
                url: _url,
                params: params,
                attributes: resource.attributes,
                timeout: resource.timeout
            });
            return loader;
        };
        function functionExecutor(param) {
            if (typeof param === 'function') {
                param = param();
            }
            return param;
        }
        function isPromise(param) {
            return typeof param === 'object' && typeof param.then === 'function';
        }
        function triggerLoadEvent(_promise, target) {
            return new Promise(function (resolve, reject) {
                ResourceLoader.triggerLoadEvent(LoaderEvent.LoadStart, target);
                _promise.then(function (result) {
                    loadEvents.push(result);
                    resolve(result);
                    ResourceLoader.triggerLoadEvent(LoaderEvent.LoadFinished, target);
                }, function (result) {
                    reject(result);
                    ResourceLoader.triggerLoadEvent(LoaderEvent.LoadError, target);
                });
            });
        }
        function loaderLoad(loader) {
            var target = {
                url: loader.finalURL()
            };
            return triggerLoadEvent(loader.load(), target);
        }
        function promiseThen(_promise) {
            var target = {
                url: _promise
            };
            if (typeof _promise === 'function') {
                _promise = _promise();
            }
            return triggerLoadEvent(_promise, target);
        }
        function initPromises() {
            var promises = [];
            if (resource.serial) {
                resource.urls.forEach(function (url) {
                    if (isPromise(url) || isFunction(url)) {
                        if (promises.length > 0) {
                            promises[0] = promises[0].then(function () {
                                return promiseThen(url);
                            });
                        }
                        else {
                            promises.push(promiseThen(url));
                        }
                    }
                    else {
                        var loader = initiateLoader(url);
                        if (promises.length > 0) {
                            promises[0] = promises[0].then(function () {
                                return loaderLoad(loader);
                            });
                        }
                        else {
                            promises.push(loaderLoad(loader));
                        }
                    }
                });
            }
            else {
                resource.urls.forEach(function (url) {
                    if (isPromise(url) || isFunction(url)) {
                        promises.push(promiseThen(url));
                    }
                    else {
                        promises.push(loaderLoad(initiateLoader(url)));
                    }
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
