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
var LoaderState;
(function (LoaderState) {
    LoaderState[LoaderState["Initing"] = 'initing'] = "Initing";
    LoaderState[LoaderState["Pending"] = 'pending'] = "Pending";
    LoaderState[LoaderState["Finished"] = 'finished'] = "Finished";
    LoaderState[LoaderState["Error"] = 'error'] = "Error";
})(LoaderState || (LoaderState = {}));
var nextId = (function () {
    var id = 1;
    return function () {
        return id++;
    };
})();
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
    Loader.prototype.createDom = function () {
    };
    Loader.prototype.isLoaded = function () {
        var loadState = this.loadState();
        if (!loadState) {
            return true;
        }
        return loadState === LoaderState.Finished;
    };
    Loader.prototype.tokenUrl = function () {
        var url = this.option.url;
        if (!this.option.token) {
            return url;
        }
        var token = 'token=' + this.option.token;
        if (this.option.url.indexOf('?') === -1) {
            token = '?' + token;
        }
        url = url + token;
        return url;
    };
    Loader.prototype.initTimeoutEvent = function () {
        var evt = document.createEvent('CustomEvent');
        evt.initEvent('timeout', false, false);
        return evt;
    };
    Loader.prototype.timeout = function () {
        var el = this.el;
        if (el.onerror && el.loadCallbacks) {
            var fnObject = el.loadCallbacks[this.timestamp];
            fnObject && fnObject.timeout.call(el, this.initTimeoutEvent());
        }
    };
    Loader.prototype.loadState = function (state) {
        var el = this.el;
        if (arguments.length === 0) {
            return el['state'];
        }
        else {
            el['state'] = state;
        }
    };
    Loader.prototype.invokeCallbacks = function (type, params, context) {
        var el = this.el;
        var callbacks = el.loadCallbacks;
        if (!callbacks) {
            return;
        }
        Object.keys(callbacks).forEach(function (key) {
            var fnObject = callbacks[key], fn = fnObject[type];
            if (fn) {
                try {
                    fn.apply(context, params);
                }
                catch (err) {
                    console.error(err);
                }
            }
        });
    };
    Loader.prototype.load = function () {
        this.createDom();
        var _ = this;
        var el = this.el;
        if (this.isLoaded()) {
            return new Promise(function (resolve, reject) {
                var loadState = _.loadState();
                if (!loadState || loadState === LoaderState.Finished) {
                    resolve();
                }
                else {
                    reject('error');
                }
            });
        }
        var onLoadFn, onErrorFn;
        var promise = new Promise(function (resolve, reject) {
            onLoadFn = wrpperFn(resolve);
            onErrorFn = wrpperFn(reject);
        });
        var timeout = this.option.timeout;
        var timeoutId;
        var loadCallbacks = el.loadCallbacks;
        var callbackInit = !!loadCallbacks;
        if (!callbackInit) {
            loadCallbacks = el.loadCallbacks = {};
        }
        var timestamp = this.timestamp;
        var loadCallback = {
            load: function (e) {
                delete loadCallbacks[timestamp];
                clearTimeout(timeoutId);
                _.loadState(LoaderState.Finished);
                onLoadFn.apply(el, arguments);
            },
            error: function (e) {
                delete loadCallbacks[timestamp];
                clearTimeout(timeoutId);
                _.loadState(LoaderState.Error);
                onErrorFn.apply(el, arguments);
            },
            timeout: function (e) {
                onErrorFn.apply(el, arguments);
            }
        };
        loadCallbacks[timestamp] = loadCallback;
        if (!callbackInit) {
            el.onload = el['onreadystatechange'] = function (e) {
                var stateText = el['readyState'];
                if (stateText && !/^c|loade/.test(stateText))
                    return;
                _.invokeCallbacks('load', [e], el);
            };
            el.onerror = function (e) {
                if (el.parentNode) {
                    el.parentNode.removeChild(el);
                }
                _.invokeCallbacks('error', [e], el);
            };
        }
        this.appendToDom();
        timeoutId = timeout && setTimeout(function () {
            _.timeout();
        }, timeout);
        return promise;
    };
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
        if (urlDom.href === url || urlDom === url + '/') {
            return url;
        }
        urlDom.href = baseURI;
        var prefixUrl = urlDom.href;
        prefixUrl = prefixUrl.replace(/\/+$/, '');
        url = url.replace(/^ \/+/, '');
        return prefixUrl + '/' + url;
    };
    return ResourceUrl;
}());

var JsLoader = (function (_super) {
    __extends(JsLoader, _super);
    function JsLoader() {
        _super.apply(this, arguments);
    }
    JsLoader.prototype.getExistElement = function (url) {
        url = ResourceUrl.parseUrl('', url);
        var scripts = Array.prototype.slice.call(document.getElementsByTagName('script'), 0);
        var script = null;
        scripts.some(function (scr) {
            var src = scr.src;
            if (!src) {
                return;
            }
            src = src.replace(/\?.*/, '');
            src = ResourceUrl.parseUrl('', src);
            if (src === url) {
                script = scr;
                return true;
            }
        });
        return script;
    };
    JsLoader.prototype.createDom = function () {
        this.el = this.getExistElement(this.option.url);
        if (!this.el) {
            this.el = document.createElement('script');
            this.el.src = this.tokenUrl();
            this.loadState(LoaderState.Initing);
        }
    };
    return JsLoader;
}(Loader));

var CssLoader = (function (_super) {
    __extends(CssLoader, _super);
    function CssLoader() {
        _super.apply(this, arguments);
    }
    CssLoader.prototype.getExistElement = function (url) {
        url = ResourceUrl.parseUrl('', url);
        var links = Array.prototype.slice.call(document.getElementsByTagName('link'), 0);
        var link = null;
        links.some(function (lnk) {
            var href = lnk.href;
            if (!href) {
                return;
            }
            href = href.replace(/\?.*/, '');
            href = ResourceUrl.parseUrl('', href);
            if (href === url) {
                link = lnk;
                return true;
            }
        });
        return link;
    };
    CssLoader.prototype.createDom = function () {
        this.el = this.getExistElement(this.option.url);
        if (!this.el) {
            this.el = document.createElement('link');
            this.el.type = 'text/css';
            this.el.rel = 'stylesheet';
            this.el['href'] = this.tokenUrl();
            this.loadState(LoaderState.Initing);
        }
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
var loaders = {
    js: JsLoader,
    css: CssLoader
};
loaders = Object.create(loaders);
var ResourceLoader = (function () {
    function ResourceLoader(option) {
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
        return new Promise(function (resolve, reject) {
            var isDirty = false;
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
            var _url = _.option.baseURI ? ResourceUrl.parseUrl(_.option.baseURI, url) : url;
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
                token: _.option.token,
                timeout: _.option.loaderTimeout
            });
            return loader;
        }
        function initPromises() {
            var promises = [];
            if (resource.serial) {
                resource.urls.forEach(function (url) {
                    var loader = initiateLoader(url);
                    if (promises.length > 0) {
                        promises[0] = promises[0].then(function () {
                            return loader.load();
                        });
                    }
                    else {
                        promises.push(loader.load());
                    }
                });
            }
            else {
                resource.urls.forEach(function (url) {
                    var loader = initiateLoader(url);
                    promises.push(loader.load());
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
