import {ElementLoader} from "./element-loader";
import {LoaderOption} from "./loader";

class ImageLoader extends ElementLoader {
  constructor(option: LoaderOption) {
    super(option);
  }

  protected appendToDom(el: HTMLElement) {
  }

  protected createDom() {
    this.el = document.createElement('img');
    this.el.src = this.finalURL();
  }
}

export {ImageLoader};