// 给云端调用套超时：演示走 natapp 隧道时，网络一抖也不会一直转圈，超时即走本地兜底。

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`请求超时（${ms}ms）`);
    this.name = "TimeoutError";
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
