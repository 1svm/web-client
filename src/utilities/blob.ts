export function formatSize(sizeInBytes: number, options = { precision: 2 }) {
  if (sizeInBytes === 0) return "0 Bytes";

  const conversionFactor = 1000;
  const unitList = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const unit = Math.floor(Math.log(sizeInBytes) / Math.log(conversionFactor));
  return `${(sizeInBytes / Math.pow(conversionFactor, unit)).toFixed(
    options.precision
  )} ${unitList[unit]}`;
}

export type TBlobChunk = {
  start: number;
  end: number;
  blob: Blob;
};

export function generateChunks(
  blob: Blob,
  options = { chunkSize: 1 }
): Array<TBlobChunk> {
  const chunkList: TBlobChunk[] = [];
  const chunkSizeInMBs = options.chunkSize * 1024 * 1024;
  let start = 0;
  while (start < blob.size) {
    let end = start + Math.min(chunkSizeInMBs, blob.size);
    chunkList.push({
      start,
      end,
      blob: blob.slice(start, end, blob.type),
    });
    start = end;
  }
  return chunkList;
}
