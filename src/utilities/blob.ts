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

export async function* generateBlobChunks(
  blob: Blob,
  options = { startIndex: 0, chunkSize: 1 }
): AsyncGenerator<TBlobChunk> {
  const chunkSizeInMBs = options.chunkSize * 1024 * 1024;
  let startIndex = options.startIndex;
  while (startIndex < blob.size) {
    const endIndex = startIndex + Math.min(chunkSizeInMBs, blob.size);
    const chunkBlob = blob.slice(startIndex, endIndex, blob.type);
    yield {
      startIndex,
      endIndex,
      blob: chunkBlob,
    };
    startIndex = endIndex;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
