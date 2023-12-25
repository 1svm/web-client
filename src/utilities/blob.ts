export function formatSize(sizeInBytes: number, options = { precision: 2 }) {
  if (sizeInBytes === 0) return "0 Bytes";

  const conversionFactor = 1000;
  const unitList = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const unit = Math.floor(Math.log(sizeInBytes) / Math.log(conversionFactor));
  return `${(sizeInBytes / Math.pow(conversionFactor, unit)).toFixed(
    options.precision
  )} ${unitList[unit]}`;
}

export function generateChunks(
  blob: Blob,
  options = { chunkSize: 1 }
): Array<Blob> {
  const chunkList: Blob[] = [];
  const chunkSizeInMBs = options.chunkSize * 1024 * 1024;
  let start = 0;
  while (start < blob.size) {
    let end = start + Math.min(chunkSizeInMBs, blob.size);
    blob.slice(start, end);
    start = end;
  }
  return chunkList;
}
