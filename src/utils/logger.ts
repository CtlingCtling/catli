let isSilent = false;

export function output(message: string | object): void {
  if (isSilent) return;
  const text = typeof message === "string" ? message : JSON.stringify(message);
  console.log(text);
}

export function setSilent(silent: boolean): void {
  isSilent = silent;
}

export function log(message: string): void {
  output(`[info] ${message}`);
}

export function error(message: string): void {
  output(`[error] ${message}`);
}

export function warn(message: string): void {
  output(`[warn] ${message}`);
}

export function debug(message: string): void {
  if (process.env.DEBUG) {
    output(`[debug] ${message}`);
  }
}
