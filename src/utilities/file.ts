export class FileUtility {
  readonly #file: File;
  readonly #conversion_factor = 1000;
  readonly #units = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  constructor(file: File) {
    this.#file = file;
  }

  get name() {
    return this.#file.name;
  }

  get bytes() {
    return this.#file.size;
  }

  get size() {
    if (this.bytes === 0) return "0 Bytes";

    const unit = Math.floor(
      Math.log(this.bytes) / Math.log(this.#conversion_factor)
    );
    return `${(this.bytes / Math.pow(this.#conversion_factor, unit)).toFixed(
      2
    )} ${this.#units[unit]}`;
  }
}
