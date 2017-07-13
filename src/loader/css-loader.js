var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var loader_1 = require('./loader');
function createCssLinkDom() {
    var el = document.createElement('link');
    el.type = 'text/css';
    el.rel = 'stylesheet';
    return el;
}
var CssLoader = (function (_super) {
    __extends(CssLoader, _super);
    function CssLoader(option) {
        this.option = {
            fileRule: /\.(css|less|scss|sass)$/
        };
        this.ele = null;
        Object.assign(this.option, option);
        this.ele = createCssLinkDom();
    }
    CssLoader.prototype.initResourceUrl = function () {
        this.ele.href = this.option.src;
    };
    CssLoader.prototype.appendToDom = function () {
        document.head.appendChild(this.ele);
    };
    return CssLoader;
})(loader_1.Loader);
//# sourceMappingURL=css-loader.js.map