function wrpperFn(fn) {
    return function () {
        fn.apply(this, arguments);
    }
}
interface LoaderOption{
    url:String;
    timeout?:number;
}
class Loader {
    option:LoaderOption = {
        url:''
    };
    el = null;
    constructor(option?:LoaderOption) {
        if(option){
            Object.assign(this.option, option);
        }
        this.createDom();
    }
    appendToDom() {
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
    load() {
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
            if (stateText && !/^c|loade/.test(stateText)) return;
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
            if(el.onerror){
                el.onerror(_.initTimeoutEvent());
            }
        },timeout);
        return promise;
    }
}

export { Loader,LoaderOption }