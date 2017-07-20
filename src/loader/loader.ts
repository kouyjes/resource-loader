/// <reference path="../types/type.d.ts" />
function wrpperFn(fn) {
    return function () {
        fn.apply(this, arguments);
    }
}
interface LoaderOption{
    url:String;
    params?:Object;
    timeout?:number;
}
enum LoaderState{
    Init = 'init',
    Pending = 'pending',
    Finished = 'finished',
    Error = 'error'
}
var nextId = (function () {
    var id = 1;
    return function () {
        return id++;
    }
})();
abstract class Loader {
    protected option:LoaderOption = {
        url:''
    };
    protected timestamp:number = nextId();
    protected el:HTMLElement = null;
    constructor(option?:LoaderOption) {
        if(option){
            Object.assign(this.option, option);
        }
    }
    protected appendToDom() {
        document.head.appendChild(this.el);
    }
    protected createDom(){
    }
    protected isLoaded(){
        var loadState = this.loadState();
        if(!loadState){
            return true;
        }
        return loadState === LoaderState.Finished;
    }
    protected tokenUrl(){
        var url = this.option.url;
        var params = this.option.params;
        if(!params){
            return url;
        }
        var queryArray= Array<String>();
        Object.keys(params).forEach(function (name) {
            var value = params[name];
            if(value){
                queryArray.push('name=' + value);
            }
        });
        var queryString = queryArray.join('&');
        if(this.option.url.indexOf('?') === -1){
            queryString = '?' + queryString;
        }
        url = url + queryString;
        return url;
    }
    protected initTimeoutEvent(){
        var evt = document.createEvent('CustomEvent');
        evt.initEvent('timeout',false,false);
        return evt;
    }
    timeout(){
        var el = this.el;
        if(el.onerror && el.loadCallbacks){
            var fnObject = el.loadCallbacks[this.timestamp];
            fnObject && fnObject.timeout.call(el,this.initTimeoutEvent());
        }
    }
    loadState(state){
        var el = this.el;
        if(arguments.length === 0){
            return el['state'];
        }else{
            el['state'] = state;
        }
    }
    private invokeCallbacks(type,params,context){
        var el = this.el;
        var callbacks = el.loadCallbacks;
        if(!callbacks){
            return;
        }
        Object.keys(callbacks).forEach(function (key) {
            var fnObject = callbacks[key],
                fn = fnObject[type];
            if(fn){
                try{
                    fn.apply(context,params);
                }catch(err){
                    console.error(err);
                }
            }
        });
    }
    load() {
        this.createDom();
        var el = this.el;
        if(this.isLoaded()){

            return new Promise((resolve,reject) => {
                var loadState = this.loadState();
                if(!loadState || loadState === LoaderState.Finished){
                    resolve();
                }else{
                    reject('error');
                }
            });
        }
        var onLoadFn, onErrorFn;
        var promise = new Promise((resolve, reject) => {
            onLoadFn = wrpperFn(resolve);
            onErrorFn = wrpperFn(reject);
        });
        var timeout = this.option.timeout;
        var timeoutId;
        var loadCallbacks = el.loadCallbacks;
        var callbackInit = !!loadCallbacks;
        if(!callbackInit){
            loadCallbacks = el.loadCallbacks = {};
        }
        var timestamp = this.timestamp;
        var loadCallback = {
            load:(e) => {
                delete loadCallbacks[timestamp];
                clearTimeout(timeoutId);
                this.loadState(LoaderState.Finished);
                onLoadFn.apply(el, arguments);
            },
            error:(e) => {
                delete loadCallbacks[timestamp];
                clearTimeout(timeoutId);
                this.loadState(LoaderState.Error);
                onErrorFn.apply(el, arguments);
            },
            timeout:(e) => {
                onErrorFn.apply(el, arguments);
            }
        };
        loadCallbacks[timestamp] = loadCallback;
        if(!callbackInit){
            el.onload = el['onreadystatechange'] = (e) => {
                var stateText = el['readyState'];
                if (stateText && !/^c|loade/.test(stateText)) return;
                this.invokeCallbacks('load',[e],el);
            };
            el.onerror = (e) => {
                var comment = document.createComment('Loader load error, Url: ' + this.option.url + ' ,loadTime:' + (new Date()));
                if(el.parentNode){
                    el.parentNode.replaceChild(comment,el);
                }else{
                    document.head.appendChild(comment);
                }
                this.invokeCallbacks('error',[e],el);
            };
        }

        this.appendToDom();

        timeoutId = timeout && setTimeout(() => {
            this.timeout();
        },timeout);
        return promise;
    }
}

export { Loader,LoaderOption,LoaderState }