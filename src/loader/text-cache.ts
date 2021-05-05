class TextCache {
  size: number;
  private __size__ = 0;
  keys: String[] = [];
  cache: {}

  constructor(size?: number = 100000) {
    this.size = size;
  }

  put(key: String, text: String) {
    if (!key || !text) {
      return;
    }
    if (text.length > this.size) {
      return;
    }
    this.keys.push(key);
    this.cache[key] = text;
    this.__size__ += text.length;

    this.limit();
  }

  get(key: String) {
    return this.cache[key] || null;
  }

  private limit() {
    var keys = this.keys, cache = this.cache;
    while (this.__size__ > this.size) {
      if (keys.length === 0) {
        break;
      }
      let key = keys.shift();
      let text = cache[key];
      delete cache[key];
      this.__size__ -= text.length;
    }
  }
}

export {TextCache}