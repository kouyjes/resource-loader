function wrpperFn(fn) {
    return function () {
        fn.apply(this, arguments);
    }
}
interface LoaderOption{
    url:String;
    token?:String|number;
    timeout?:number;
}
enum LoaderState{
    Initing = 'initing',
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
class Loader {
    option:LoaderOption = {
        url:''
    };
    timestamp:number = nextId();
    el = null;
    constructor(option?:LoaderOption) {
        if(option){
            Object.assign(this.option, option);
        }
    }
    appendToDom() {
        document.head.appendChild(this.el);
    }
    createDom(){
    }
    isLoaded(){
        var loadState = this.loadState();
        if(!loadState){
            return true;
        }
        return loadState === LoaderState.Finished;
    }
    tokenUrl(){
        var url = this.option.url;
        if(!this.option.token){
            return url;
        }
        var token = 'token=' + this.option.token;
        if(this.option.url.indexOf('?') === -1){
            token = '?' + token;
        }
        url = url + token;
        return url;
    }
    initTimeoutEvent(){
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
        var _ = this;
        var el = this.el;
        if(this.isLoaded()){
            return new Promise(function (resolve,reject) {
                var loadState = _.loadState();
                if(!loadState || loadState === LoaderState.Finished){
                    resolve();
                }else{
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
        if(!callbackInit){
            loadCallbacks = el.loadCallbacks = {};
        }
        var timestamp = this.timestamp;
        var loadCallback = {
            load:function (e) {
                delete loadCallbacks[timestamp];
                clearTimeout(timeoutId);
                _.loadState(LoaderState.Finished);
                onLoadFn.apply(el, arguments);
            },
            error:function (e) {
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
        if(!callbackInit){
            el.onload = el['onreadystatechange'] = function (e) {
                var stateText = el['readyState'];
                if (stateText && !/^c|loade/.test(stateText)) return;
                _.invokeCallbacks('load',[e],el);
            };
            el.onerror = function (e) {
                if(el.parentNode){
                    el.parentNode.removeChild(el);
                }
                _.invokeCallbacks('error',[e],el);
            };
        }

        this.appendToDom();

        timeoutId = timeout && setTimeout(function () {
            _.timeout();
        },timeout);
        return promise;
    }
}

export { Loader,LoaderOption,LoaderState }