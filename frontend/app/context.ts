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
  sidebarActiveItem: string | null;
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

type SetSidebarOpenAction = {
  type: 'SET_SIDEBAR_OPEN';
  payload: boolean;
};

type SetSidebarActiveItemAction = {
  type: 'SET_SIDEBAR_ACTIVE_ITEM';
  payload: string;
};

type ReloadSidebarAction = {
  type: 'RELOAD_SIDEBAR';
  payload?: never;
};

export type Action =
  | UpdateCurrentQueryAction
  | ToggleSidebarAction
  | SetSidebarOpenAction
  | SetSidebarActiveItemAction
  | ReloadSidebarAction;

export default createContext<ContextType>({
  currentQuery: { query: null, queryId: null },
  isSidebarOpen: false,
  sidebarActiveItem: null,
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
    case 'SET_SIDEBAR_OPEN':
      return {
        ...state,
        isSidebarOpen: payload,
      };
    case 'SET_SIDEBAR_ACTIVE_ITEM':
      return {
        ...state,
        sidebarActiveItem: payload,
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
