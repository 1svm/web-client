export class ChunkFile {
  public progress = 0;
  public abortCtrl = new AbortController();
  private file: File;
  private conversion_factor = 1000;
  private chunkSize = 1 * 1024 * 1024;
  private units = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  constructor(file: File) {
    this.file = file;
  }

  *blobIterator() {
    let currentChunk = 0;
    while (true) {
      let start = currentChunk * this.chunkSize;
      let end = start + this.chunkSize;
      if (end > this.bytes) {
        return {
          start,
          end: this.bytes,
          blob: this.file.slice(start, this.bytes),
        };
      }
      yield {
        start,
        end,
        blob: this.file.slice(start, end),
      };
      currentChunk++;
    }
  }

  public formatBytes(precision = 2) {
    if (this.file.size === 0) return "0 Bytes";

    const unit = Math.floor(
      Math.log(this.file.size) / Math.log(this.conversion_factor)
    );
    return `${(this.file.size / Math.pow(this.conversion_factor, unit)).toFixed(
      precision
    )} ${this.units[unit]}`;
  }

  get name() {
    return this.file.name;
  }

  get bytes() {
    return this.file.size;
  }
}
