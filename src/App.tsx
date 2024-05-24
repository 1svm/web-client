import { useReducer, ChangeEvent } from "react";
import { formatBlobSize, generateBlobIterator } from "./utilities";

const enum FileStatus {
  NOT_STARTED,
  STARTED,
  PAUSED,
  CANCELLED,
  FAILED,
}

type TFile = {
  file: File;
  progress: number | null;
  status: FileStatus;
  abortController: AbortController;
  errors: Error[];
};

const initialState: Record<string, TFile> = {};

type TReducerAction = {
  type: EReducerActionType;
  payload?: unknown;
  id?: string;
};

const enum EReducerActionType {
  SET,
  INIT,
  ERROR,
  PAUSED,
  PROGRESS,
}

function reducer(state: typeof initialState, action: TReducerAction) {
  switch (action.type) {
    case EReducerActionType.SET:
      const fileList = action.payload as FileList;
      const newState: typeof initialState = {};
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList.item(i);
        if (!file) continue;
        const id = `${file.size}:${file.name}`;
        newState[id] = {
          file,
          progress: null,
          errors: [],
          abortController: new AbortController(),
          status: FileStatus.NOT_STARTED,
        };
      }
      return newState;
    case EReducerActionType.INIT: {
      const id = action.id as string;
      return {
        ...state,
        [id]: {
          ...state[id],
          progress: 0,
          status: FileStatus.STARTED,
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
    case EReducerActionType.PROGRESS: {
      const id = action.id as string;
      return {
        ...state,
        [id]: {
          ...state[id],
          progress: action.payload as number,
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
      type: EReducerActionType.SET,
      payload: ev.target.files,
    });
  };

  const handleFileUpload = async (id: string) => {
    dispatch({
      type: EReducerActionType.INIT,
      id,
    });
    const chunkIterator = generateBlobIterator(state[id].file);
    for await (const chunk of chunkIterator) {
      const headers = new Headers();
      headers.append("X-Video-ID", id);
      headers.append("X-Filename", state[id].file.name);
      headers.append(
        "Content-Range",
        `bytes ${chunk.startIndex}-${chunk.endIndex}/${state[id].file.size}`
      );
      const body = new FormData();
      body.append("chunk", chunk.blob);
      try {
        const response = await fetch(
          `${import.meta.env["VITE_AUTH-SERVICE_URL"]}:${
            import.meta.env["VITE_AUTH-SERVICE_PORT"]
          }/videos`,
          {
            method: "POST",
            headers,
            body,
            signal: state[id].abortController?.signal,
          }
        );
        if (!response.ok) {
          dispatch({
            type: EReducerActionType.ERROR,
            payload: new Error("Something went wrong!"),
            id,
          });
          return;
        }
        dispatch({
          type: EReducerActionType.PROGRESS,
          payload: Math.round((chunk.endIndex / state[id].file.size) * 100),
          id,
        });
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
      <label htmlFor="videos">Choose video files:</label>
      <input
        type="file"
        id="videos"
        name="videos"
        onChange={handleFileChange}
        accept="video/mp4, video/x-m4v, video/*"
        multiple
      />
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
