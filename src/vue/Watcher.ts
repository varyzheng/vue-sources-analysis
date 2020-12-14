export default class Watcher {
  task: () => void

  constructor(task: () => void) {
    this.task = task;
  }
}
