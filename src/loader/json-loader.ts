import {TextLoader} from "./text-loader";
import {LoaderOption} from "./loader";

class JsonLoader extends TextLoader {
  constructor(option: LoaderOption) {
    super(option);
  }

  load(): Promise {
    return super.load().then((data) => {
      return JSON.parse(data);
    });
  }
}

export {JsonLoader}