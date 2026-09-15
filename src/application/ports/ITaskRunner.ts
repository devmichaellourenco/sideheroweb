export interface ITaskRunner {
  run<T>(task: () => Promise<T>): Promise<T>;
}
