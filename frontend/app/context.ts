import { createContext } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface CurrentQuery {
  query: string | null;
  // A unique ID for the current
  queryId: string | null;
}

interface ContextType {
  currentQuery: CurrentQuery;
  isSidebarOpen: boolean;
  reloadSidebarCounter: number;
  dispatch?: React.Dispatch<Action>;
}

type UpdateCurrentQueryAction = {
  type: 'UPDATE_CURRENT_QUERY';
  payload: ContextType['currentQuery']['query'];
};

type ToggleSidebarAction = {
  type: 'TOGGLE_SIDEBAR';
  payload?: never;
};

type ReloadSidebarAction = {
  type: 'RELOAD_SIDEBAR';
  payload?: never;
};

export type Action =
  | UpdateCurrentQueryAction
  | ToggleSidebarAction
  | ReloadSidebarAction;

export default createContext<ContextType>({
  currentQuery: { query: null, queryId: null },
  isSidebarOpen: false,
  reloadSidebarCounter: 0,
});

export function reducer(
  state: ContextType,
  { type, payload }: Action
): ContextType {
  switch (type) {
    case 'UPDATE_CURRENT_QUERY':
      let queryId: string | null = null;
      if (payload) {
        queryId = uuidv4();
      }
      return {
        ...state,
        currentQuery: {
          query: payload,
          queryId,
        },
      };
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        isSidebarOpen: !state.isSidebarOpen,
      };
    case 'RELOAD_SIDEBAR':
      return {
        ...state,
        reloadSidebarCounter: state.reloadSidebarCounter + 1,
      };
    default:
      throw new Error('Unknown action type');
  }
}
