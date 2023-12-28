export function formatBlobSize(
  sizeInBytes: number,
  options = { precision: 2 }
) {
  if (sizeInBytes === 0) return "0 Bytes";

  const conversionFactor = 1000;
  const unitList = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const unit = Math.floor(Math.log(sizeInBytes) / Math.log(conversionFactor));
  return `${(sizeInBytes / Math.pow(conversionFactor, unit)).toFixed(
    options.precision
  )} ${unitList[unit]}`;
}

export type TBlobChunk = {
  startIndex: number;
  endIndex: number;
  blob: Blob;
};

export function generateBlobChunks(
  blob: Blob,
  options = { chunkSize: 1 }
): TBlobChunk[] {
  const chunkList: TBlobChunk[] = [];
  const chunkSizeInMBs = options.chunkSize * 1024 * 1024;
  let startIndex = 0;
  while (startIndex < blob.size) {
    let endIndex = startIndex + Math.min(chunkSizeInMBs, blob.size);
    chunkList.push({
      startIndex,
      endIndex,
      blob: blob.slice(startIndex, endIndex, blob.type),
    });
    startIndex = endIndex;
  }
  return chunkList;
}
