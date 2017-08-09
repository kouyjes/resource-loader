/// <reference path="../types/type.d.ts" />
function wrapperFn(fn) {
    return function () {
        fn.apply(this, arguments);
    }
}
/**
 * loader config option
 * url: resource url
 * params: url query params eg:{code:123}
 * timeout: load timeout in ms
 */
interface LoaderOption{
    url:String;
    params?:Object;
    timeout?:number;
}
/**
 * load state
 */
enum LoaderState{
    Null = 'null',
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
/**
 * base abstract class loader
 */
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
    protected finalURL(){
        var url = this.option.url;
        var params = this.option.params;
        if(!params){
            return url;
        }
        var queryArray= Array<String>();
        Object.keys(params).forEach(function (name) {
            var value = params[name];
            if(value){
                queryArray.push(name + '=' + value);
            }
        });
        if(queryArray.length === 0){
            return url;
        }
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
        if(!el){
            return LoaderState.Null;
        }
        if(arguments.length === 0){
            return el['state'];
        }else{
            el['state'] = state;
        }
    }
    private invokeCallbacks(type){
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
                    fn();
                }catch(err){
                    console.error(err);
                }
            }
        });
    }
    protected createLoadEvent(state:String = 'success'){
        return {
            state:state,
            url:this.option.url,
            target:this.el
        };
    }
    /**
     * start load
     * @returns {Promise<T>}
     */
    load():Promise {
        this.createDom();
        var el = this.el;
        if(this.isLoaded()){

            return new Promise((resolve,reject) => {
                var loadState = this.loadState();
                if(!loadState || loadState === LoaderState.Finished){
                    resolve(this.createLoadEvent());
                }else{
                    reject(this.createLoadEvent('error'));
                }
            });
        }
        var onLoadFn, onErrorFn;
        var promise = new Promise((resolve, reject) => {
            onLoadFn = wrapperFn(resolve);
            onErrorFn = wrapperFn(reject);
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
            load:() => {
                delete loadCallbacks[timestamp];
                clearTimeout(timeoutId);
                this.loadState(LoaderState.Finished);
                onLoadFn.call(undefined, this.createLoadEvent());
            },
            error:() => {
                delete loadCallbacks[timestamp];
                clearTimeout(timeoutId);
                this.loadState(LoaderState.Error);
                onErrorFn.call(undefined, this.createLoadEvent('error'));
            },
            timeout:() => {
                onErrorFn.call(undefined, this.createLoadEvent('timeout'));
            }
        };
        loadCallbacks[timestamp] = loadCallback;
        if(!callbackInit){
            el.onload = el['onreadystatechange'] = () => {
                var stateText = el['readyState'];
                if (stateText && !/^c|loade/.test(stateText)) return;
                this.invokeCallbacks('load');
            };
            el.onerror = () => {
                var comment = document.createComment('Loader load error, Url: ' + this.option.url + ' ,loadTime:' + (new Date()));
                if(el.parentNode){
                    el.parentNode.replaceChild(comment,el);
                }else{
                    document.head.appendChild(comment);
                }
                this.invokeCallbacks('error');
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