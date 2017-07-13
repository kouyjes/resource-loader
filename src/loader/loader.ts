function wrpperFn(fn){
    return function () {
        fn.apply(this,arguments);
    }
}
class Loader{
    option:Object = {
        fileRule:/.$/
    };
    ele = null;
    appendToDom(){}
    match(fileName){
        return this.option.fileRule.test(fileName);
    }
    initResourceUrl(){
        this.ele.src = this.option.src;
    }
    load(){
        var el = this.ele;
        var onloadFn,onErrorFn;
        var promise = new Promise(function (resolve,reject) {
            onloadFn = wrpperFn(resolve);
            onErrorFn = wrpperFn(reject);
        });
        el.onload = el['onreadystatechange'] = function (e) {
            var stateText = el['readyState'];
            if (stateText && !/^c|loade/.test(stateText)) return;
            el.onload = el['onreadystatechange'] = null;
            onloadFn.call(this,e);
        };
        el.onerror = onErrorFn;

        this.initResourceUrl();

        this.appendToDom();

        return promise;
    }
}