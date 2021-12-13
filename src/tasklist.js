export default class TaskList {
  /**
   * @param {Object} options
   * @param {Number} options.maxTaskNumber
   * @param {Function} options.onTaskCompeleteListener
   * @param {Function} options.onTaskCancelListener
   * @param {Number} options.taskTimeout the maximum waiting time in milliseconds for the completion of a task
   */
  constructor(options) {
    this.tasks = [];
    this.maxTaskNumber = options.maxTaskNumber;
    this.onTaskCompeleteListener = options.onTaskCompeleteListener;
    this.onTaskCancelListener = options.onTaskCancelListener;
    this.taskTimeout = options.taskTimeout;
    this.taskStartingTime = {};

    this.watchTasks = this.watchTasks.bind(this);
    this.taskWatcherTimer = setInterval(
      this.watchTasks,
      this.taskTimeout + 1000
    );
  }

  hasTask(id) {
    return this.tasks.includes(id);
  }

  get taskIsFull() {
    return this.tasks.length >= this.maxTaskNumber;
  }

  get taskIsEmpty() {
    return this.tasks.length === 0;
  }

  /**
   *
   * @param {String} id
   * @param {Promise} thenable
   * @returns {Boolean} the task was successfully added or not.
   */
  addTask(id, thenable) {
    if (this.tasks.length === this.maxTaskNumber) {
      return false;
    }
    if (this.hasTask(id)) {
      return false;
    }

    this.tasks.push(id);
    this.taskStartingTime[id] = Date.now();
    const that = this;
    const onThenableNext = function () {
      that.onTaskCompeleted(id, arguments);
    };
    const onThenableError = function () {
      that.onTaskError(id, arguments);
    };
    thenable.then(onThenableNext).catch(onThenableError);
  }

  removeTask(id) {
    delete this.taskStartingTime[id];
    if (this.tasks.includes(id)) {
      this.tasks.splice(this.tasks.indexOf(id), 1);
    }
  }

  /**
   * @param {String}  the id of the task
   * @param {any} the result which is returned by the task
   * @private
   */
  onTaskCompeleted(id, args) {
    // this task was removed
    if (!this.tasks.includes(id)) {
      return;
    }

    this.removeTask(id);
    this.onTaskCompeleteListener.apply(undefined, [id, ...args]);
  }

  onTaskError(id, args) {
    this.removeTask(id);
    this.onTaskCancelListener.apply(undefined, [id, ...args]);
  }

  /**
   * @private
   */
  watchTasks() {
    const deprecatedTasks = [];
    for (const taskId in this.taskStartingTime) {
      const taskEillipsedTime = Date.now() - this.taskStartingTime[taskId];
      if (taskEillipsedTime > this.taskTimeout) {
        deprecatedTasks.push(taskId);
      }
    }
    for (const taskId of deprecatedTasks) {
      this.removeTask(taskId);
    }
    for (const taskId of deprecatedTasks) {
      this.onTaskCancelListener(taskId);
    }
  }

  stopWorking() {
    clearInterval(this.taskWatcherTimer);
  }
}
