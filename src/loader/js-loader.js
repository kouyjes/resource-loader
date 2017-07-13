var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var loader_1 = require('./loader');
function createScriptDom() {
    return document.createElement('script');
}
var JsLoader = (function (_super) {
    __extends(JsLoader, _super);
    function JsLoader(option) {
        this.option = {
            fileRule: /\.(js|ts)$/
        };
        this.ele = null;
        Object.assign(this.option, option);
        this.ele = createScriptDom();
    }
    JsLoader.prototype.appendToDom = function () {
        document.head.appendChild(this.ele);
    };
    return JsLoader;
})(loader_1.Loader);
//# sourceMappingURL=js-loader.js.map