function wrpperFn(fn) {
    return function () {
        fn.apply(this, arguments);
    };
}
var Loader = (function () {
    function Loader() {
        this.option = {
            fileRule: /.$/
        };
        this.ele = null;
    }
    Loader.prototype.appendToDom = function () { };
    Loader.prototype.match = function (fileName) {
        return this.option.fileRule.test(fileName);
    };
    Loader.prototype.initResourceUrl = function () {
        this.ele.src = this.option.src;
    };
    Loader.prototype.load = function () {
        var el = this.ele;
        var onloadFn, onErrorFn;
        var promise = new Promise(function (resolve, reject) {
            onloadFn = wrpperFn(resolve);
            onErrorFn = wrpperFn(reject);
        });
        el.onload = el['onreadystatechange'] = function (e) {
            var stateText = el['readyState'];
            if (stateText && !/^c|loade/.test(stateText))
                return;
            el.onload = el['onreadystatechange'] = null;
            onloadFn.call(this, e);
        };
        el.onerror = onErrorFn;
        this.initResourceUrl();
        this.appendToDom();
        return promise;
    };
    return Loader;
})();
//# sourceMappingURL=loader.js.map