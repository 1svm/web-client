import { useReducer, ChangeEvent } from "react";
import { formatSize, generateChunks, type TBlobChunk } from "./utilities";

type TFile = {
  file: File;
  chunks: TBlobChunk[];
  progress: number;
  abortController: AbortController;
};

const initialState: Array<TFile> = [];

type TReducerAction = {
  type: EReducerActionType;
  payload: unknown;
};

const enum EReducerActionType {
  SET_FILES,
}

function reducer(state: typeof initialState, action: TReducerAction) {
  switch (action.type) {
    case EReducerActionType.SET_FILES:
      const fileList = action.payload as FileList;
      return Array.from(fileList ?? [], (file) => ({
        file,
        progress: 0,
        abortController: new AbortController(),
        chunks: generateChunks(file),
      }));
    default:
      return state;
  }
}

function action() {}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleFileChange = (ev: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: EReducerActionType.SET_FILES,
      payload: ev.target.files,
    });
  };

  const handleFileUpload = async (idx: number) => {
    const { file, chunks, abortController } = state[idx];
    for (const chunk of chunks) {
      const headers = new Headers();
      headers.append(
        "Content-Range",
        `bytes ${chunk.start}-${chunk.end}/${file.size}`
      );
      const body = new FormData();
      body.append("chunk", chunk.blob);
      try {
        const response = await fetch("/files", {
          method: "POST",
          headers,
          body,
          signal: abortController.signal,
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
      {state.length ? (
        <ul>
          {state.map(({ file, progress }: TFile, idx: number) => (
            <li key={file.name}>
              {file.name} -- {formatSize(file.size)}
              <button type="button" onClick={() => handleFileUpload(idx)}>
                Start
              </button>
              <label htmlFor="file">Upload progress:</label>
              <progress id="file" max="100" value={progress} />
              <span>{progress}%</span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

export default App;
