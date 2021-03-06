import {Loader} from './loader/loader';
import {JsLoader} from './loader/js-loader';
import {CssLoader} from './loader/css-loader';
import {ResourceUrl} from './loader/url-parser';
import {polyfill} from './polyfill';
import {TextLoader} from "./loader/text-loader";
import {JsonLoader} from "./loader/json-loader";
import {ImageLoader} from "./loader/image-loader";

polyfill();

interface ResourceLoaderOption {
  baseURI?: String;
  params?: Object,
  timeout?: number;
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
  type: String;
  urls: String[];
  serial?: Boolean;
  dependence?: Resource;
  params?: Object;
  attributes?: Object;
  timeout?: number;
}

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

enum LoaderEvent {
  LoadStart = 'loadStart',
  LoadFinished = 'loadFinished',
  LoadError = 'loadError'
}

class ResourceLoader {
  private static loadEventListener = {};
  static addEventListener = function (eventType: String, handler: Function) {
    var listeners = ResourceLoader.loadEventListener[eventType] || [];
    if (isFunction(handler) && listeners.indexOf(handler) === -1) {
      listeners.push(handler);
      ResourceLoader.loadEventListener[eventType] = listeners;
    }
  };
  static removeEventListener = function (eventType: String, handler: Function) {
    var listeners = ResourceLoader.loadEventListener[eventType] || [];
    var index = listeners.indexOf(handler);
    if (index >= 0) {
      listeners.splice(index, 1);
    }
  };

  static triggerLoadEvent(eventType: LoaderEvent, target) {
    var listeners = ResourceLoader.loadEventListener[eventType];
    listeners && listeners.forEach(function (fn) {
      try {
        fn(target);
      } catch (e) {
        console.error(e);
      }
    });
  }

  static registerLoader(type: String, loader: Loader) {
    loaders[type] = loader;
    return ResourceLoader;
  };

  static load = function (resource: Resource | Resource[], ...other: Resource[]) {
    var loader = new ResourceLoader();
    return loader.load.apply(loader, arguments);
  }
  private option: ResourceLoaderOption = {};

  constructor(option?: ResourceLoaderOption) {
    if (option) {
      Object.assign(this.option, option);
    }
  }

  private initTimeoutEvent() {
    var evt = document.createEvent('CustomEvent');
    evt.initEvent('timeout', false, false);
    return evt;
  }

  load(resource: Resource | Resource[], ...other: Resource[]) {

    var loadEvents = [];
    var loadFn = (resource: Resource | Resource[], ...other: Resource[]) => {
      var promises = [];
      if (resource) {
        if (!(resource instanceof Array)) {
          promises.push(this._loadResource(<Resource>resource, loadEvents));
        } else {
          (<Resource[]>resource).forEach((resource) => {
            promises.push(this._loadResource(resource, loadEvents));
          });
        }
      }
      var promise = Promise.all(promises);
      other.forEach((resource) => {
        if (!resource) {
          return;
        }
        promise = promise.then(() => {
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

  }

  private _loadResource(resource: Resource, loadEvents: any[] = []) {
    var timeout = this.option.timeout;
    var promise = this.__load(resource, loadEvents);
    if (!timeout) {
      return promise;
    }
    return new Promise((resolve, reject) => {
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
  }

  parseUrl(url: String) {
    return ResourceUrl.parseUrl(this.option.baseURI, url);
  }

  private __load(resource: Resource, loadEvents: any[]) {

    var promise;

    if (resource.dependence) {
      if (resource.dependence instanceof Array) {
        promise = Promise.all(resource.dependence.map(function (dependence) {
          return this.__load(dependence, loadEvents);
        }.bind(this)));
      } else {
        promise = this.__load(resource.dependence, loadEvents);
      }
    }

    var initiateLoader = (url) => {
      var _url = this.parseUrl(url);
      var type = resource.type;
      if (type) {
        type = type.toLowerCase();
      }
      var loaderFn = loaders[type];
      if (!loaderFn) {
        throw new Error('resource type is not support !');
      }
      var params = Object.assign({}, this.option.params);
      Object.assign(params, resource.params);
      var loader = new loaderFn({
        url: _url,
        params: params,
        attributes: resource.attributes,
        timeout: resource.timeout
      });
      return loader;
    }

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

    function loaderLoad(loader: Loader) {
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
            } else {
              promises.push(promiseThen(url));
            }
          } else {
            var loader = initiateLoader(url);
            if (promises.length > 0) {
              promises[0] = promises[0].then(function () {
                return loaderLoad(loader);
              });
            } else {
              promises.push(loaderLoad(loader));
            }
          }

        });
      } else {
        resource.urls.forEach(function (url) {
          if (isPromise(url) || isFunction(url)) {
            promises.push(promiseThen(url));
          } else {
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
    } else {
      promise = Promise.all(initPromises());
    }
    return promise;
  }
}

export {Loader, ResourceLoader}