import { useState, ChangeEvent } from "react";
import { ChunkFile } from "./services";

function App() {
  const [files, setFiles] = useState<Array<ChunkFile>>();

  const handleFileChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setFiles(
      Array.from(ev.target.files ?? [], (file: File) => new ChunkFile(file))
    );
  };

  const uploadFile = async (idx: number) => {
    if (!files) return;
    const file = files[idx];
    for (const chunk of file.blobIterator()) {
      const headers = new Headers();
      headers.append(
        "Content-Range",
        `bytes ${chunk.start}-${chunk.end}/${file.bytes}`
      );
      const body = new FormData();
      body.append("chunk", chunk.blob);
      try {
        const response = await fetch("/files", {
          method: "POST",
          headers,
          body,
          signal: file.abortCtrl.signal,
        });
        if (!response.ok) {
          console.error("Error uploading file:", response.statusText);
          return;
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Network error during file upload:", error.message);
        } else {
          console.info("Upload Paused");
        }
      }
    }
  };

  return (
    <>
      <input type="file" name="files" onChange={handleFileChange} multiple />
      {files ? (
        <ul>
          {files.map((file: ChunkFile, idx: number) => (
            <li key={file.name}>
              {file.name} -- {file.formatBytes()}
              <button type="button" onClick={() => uploadFile(idx)}>
                Start
              </button>
              <label htmlFor="file">Upload progress:</label>
              <progress id="file" max="100" value={file.progress} />
              <span>{file.progress}%</span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

export default App;
