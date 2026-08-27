export interface ILifecycle {
  init(): Promise<void> | void;
  start?(): Promise<void> | void;
  destroy(): Promise<void> | void;
}
