interface PromiseCall {
  resolve: Function;
  reject: Function;
}

interface RequestQueueOption {
  status?: number;
  data?: any;
  calls?: PromiseCall[];
}

class RequestQueueManager {
  private requestQueues;

  constructor() {
    Object.defineProperty(this, 'requestQueues', {
      value: {}
    });
  }

  executeQueue(key: String, type: String, data) {
    var request = this.requestQueues[key];
    if (!request) {
      return;
    }
    request.execute(type, data);
  }

  putQueue(key: String, request: RequestQueue) {
    this.requestQueues[key] = request;
  }

  getQueue(key: String): RequestQueue {
    return this.requestQueues[key] || null;
  }

  removeQueue(key: String) {
    var queue = this.requestQueues[key];
    delete this.requestQueues[key];
    return queue;
  }
}

class RequestQueue implements RequestQueueOption {
  status: number = 0;
  data: any = null;
  calls: PromiseCall[] = [];

  constructor(option: RequestQueueOption = {}) {
    if (option.status) {
      this.status = option.status;
    }
    if (option.data) {
      this.data = option.data;
    }
    if (option.calls) {
      this.calls = option.calls;
    }
  }

  execute(type: String, data) {
    this.data = data;
    if (type === 'resolve') {
      this.status = 1;
    } else if (type === 'reject') {
      this.status = 2;
      console.error(data);
    }
    this.calls.forEach(function (call) {
      var fn = call[type];
      try {
        fn(data)
      } catch (e) {
        console.error(e);
      }
    });
    this.calls.length = 0;
  }
}

export {RequestQueue, RequestQueueManager}