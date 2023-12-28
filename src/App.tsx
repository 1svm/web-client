import { useReducer, ChangeEvent } from "react";
import {
  formatBlobSize,
  generateBlobChunks,
  type TBlobChunk,
} from "./utilities";

const enum FileStatus {
  NOT_STARTED,
  STARTED,
  PAUSED,
  CANCELLED,
  FAILED,
}

type TFile = {
  file: File;
  status: FileStatus;
  chunks: TBlobChunk[];
  progress: number | null;
  abortController: AbortController | null;
  errors: Error[];
};

const initialState: Record<string, TFile> = {};

type TReducerAction = {
  type: EReducerActionType;
  payload?: unknown;
  id?: string;
};

const enum EReducerActionType {
  ADD_FILES,
  INIT,
  ERROR,
  PAUSED,
}

function reducer(state: typeof initialState, action: TReducerAction) {
  switch (action.type) {
    case EReducerActionType.ADD_FILES:
      const fileList = action.payload as FileList;
      const newState: typeof initialState = {};
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList.item(i);
        if (!file) continue;
        newState[`${file.name}:${file.size}`] = {
          file,
          chunks: [],
          progress: null,
          abortController: null,
          errors: [],
          status: FileStatus.NOT_STARTED,
        };
      }
      return newState;
    case EReducerActionType.INIT: {
      const id = action.id as string;
      const chunks = action.payload as TBlobChunk[];
      return {
        ...state,
        [id]: {
          ...state[id],
          chunks,
          progress: 0,
          status: FileStatus.STARTED,
          abortController: new AbortController(),
        },
      };
    }
    case EReducerActionType.ERROR: {
      const id = action.id as string;
      return {
        ...state,
        [id]: {
          ...state[id],
          status: FileStatus.FAILED,
          errors: [],
        },
      };
    }
    case EReducerActionType.PAUSED: {
      const id = action.id as string;
      return {
        ...state,
        [id]: {
          ...state[id],
          status: FileStatus.PAUSED,
        },
      };
    }
    default: {
      return state;
    }
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleFileChange = (ev: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: EReducerActionType.ADD_FILES,
      payload: ev.target.files,
    });
  };

  const handleFileUpload = async (id: string) => {
    const chunks = generateBlobChunks(state[id].file);
    dispatch({
      type: EReducerActionType.INIT,
      payload: chunks,
      id,
    });
    for (const chunk of chunks) {
      const headers = new Headers();
      headers.append(
        "Content-Range",
        `bytes ${chunk.startIndex}-${chunk.endIndex}/${state[id].file.size}`
      );
      const body = new FormData();
      body.append("id", id);
      body.append("chunk", chunk.blob);
      try {
        const response = await fetch("/files", {
          method: "POST",
          headers,
          body,
          signal: state[id].abortController?.signal,
        });
        if (!response.ok) {
          dispatch({
            type: EReducerActionType.ERROR,
            payload: new Error("Something went wrong!"),
            id,
          });
          return;
        }
      } catch (err: unknown) {
        const error = err as Error;
        if (error.name !== "AbortError") {
          dispatch({
            type: EReducerActionType.ERROR,
            payload: error,
            id,
          });
          return;
        }
        dispatch({
          type: EReducerActionType.PAUSED,
          id,
        });
      }
    }
  };

  return (
    <>
      <input type="file" name="files" onChange={handleFileChange} multiple />
      {Object.keys(state).length ? (
        <ul>
          {Object.entries(state).map(([id, { file, progress, status }]) => (
            <li key={file.name}>
              {file.name} -- {formatBlobSize(file.size)}
              <button type="button" onClick={() => handleFileUpload(id)}>
                {status === FileStatus.NOT_STARTED ? "Start" : "Pause"}
              </button>
              {typeof progress === "number" ? (
                <>
                  <label htmlFor="file">Upload progress:</label>
                  <progress id="file" max="100" value={progress} />
                  <span>{progress}%</span>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

export default App;
