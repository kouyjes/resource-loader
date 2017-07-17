function wrpperFn(fn) {
    return function () {
        fn.apply(this, arguments);
    }
}
interface LoaderOption{
    url:String;
    timeout?:number;
}
enum LoaderState{
    Init = 'inited',
    Pending = 'pending',
    Finished = 'finished',
    Error = 'error'
}
class Loader {
    option:LoaderOption = {
        url:''
    };
    status = {
        state:LoaderState.Init
    };
    el = null;
    constructor(option?:LoaderOption) {
        if(option){
            Object.assign(this.option, option);
        }
        this.createDom();
    }
    appendToDom() {
        document.head.appendChild(this.el);
    }
    removeFromDom(){
        document.head.removeChild(this.el);
    }
    createDom(){
    }
    initResourceUrl() {
        this.el.src = this.option.url;
    }
    initTimeoutEvent(){
        var evt = document.createEvent('CustomEvent');
        evt.initEvent('timeout',false,false);
        return evt;
    }
    timeout(){
        var el = this.el;
        if(el.onerror){
            el.onerror(this.initTimeoutEvent());
        }
    }
    load() {
        var _ = this;
        var el = this.el;
        var onLoadFn, onErrorFn;
        var promise = new Promise(function (resolve, reject) {
            onLoadFn = wrpperFn(resolve);
            onErrorFn = wrpperFn(reject);
        });
        var timeout = this.option.timeout;
        var timeoutId;
        var isTimeout = false;
        el.onload = el['onreadystatechange'] = function (e) {
            var stateText = el['readyState'];
            if (stateText && !/^c|loade/.test(stateText)) return;
            clearTimeout(timeoutId);
            el.onload = el['onreadystatechange'] = null;
            _.status.state = LoaderState.Finished;
            onLoadFn.apply(this, arguments);
        };
        el.onerror = function () {
            this.onTimeout = el.onerror = null;
            clearTimeout(timeoutId);
            _.status.state = LoaderState.Error;
            onErrorFn.apply(this, arguments);
            _.removeFromDom();
        };

        this.initResourceUrl();

        this.appendToDom();
        _.status.state = LoaderState.Pending;

        timeoutId = timeout && setTimeout(function () {
            isTimeout = true;
            _.timeout();
        },timeout);
        return promise;
    }
}

export { Loader,LoaderOption,LoaderState }