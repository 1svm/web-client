import { useReducer, ChangeEvent } from "react";
import {
  formatBlobSize,
  generateBlobChunks,
  type TBlobChunk,
} from "./utilities";

type TFile = {
  file: File;
  chunks: Array<TBlobChunk>;
  progress: number;
  abortController: AbortController;
  errors: Array<Error>;
};

const initialState: Record<string, TFile> = {};

type TReducerAction = {
  type: EReducerActionType;
  payload: unknown;
};

const enum EReducerActionType {
  INIT_FILES_FOR_UPLOAD,
}

function reducer(state: typeof initialState, action: TReducerAction) {
  switch (action.type) {
    case EReducerActionType.INIT_FILES_FOR_UPLOAD:
      const fileList = action.payload as FileList;
      const newState: typeof initialState = {};
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList.item(i);
        if (!file) continue;
        newState[`${file.name}:${file.size}`] = {
          file,
          chunks: [],
          progress: 0,
          abortController: new AbortController(),
          errors: [],
        };
      }
      return newState;
    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleFileChange = (ev: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: EReducerActionType.INIT_FILES_FOR_UPLOAD,
      payload: ev.target.files,
    });
  };

  const handleFileUpload = async (id: string) => {
    const { file, chunks, abortController } = state[id];
    for (const chunk of chunks) {
      const headers = new Headers();
      headers.append(
        "Content-Range",
        `bytes ${chunk.startIndex}-${chunk.endIndex}/${file.size}`
      );
      const body = new FormData();
      body.append("id", id);
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
          {Object.entries(state).map(([id, { file, progress }]) => (
            <li key={file.name}>
              {file.name} -- {formatBlobSize(file.size)}
              <button type="button" onClick={() => handleFileUpload(id)}>
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
