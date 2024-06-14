import { createContext } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface CurrentQuery {
  query: string | null;
  // A unique ID for the current
  queryId: string | null;
}

interface ContextType {
  currentQuery: CurrentQuery;
  dispatch?: React.Dispatch<Action>;
}

type UpdateCurrentQueryAction = {
  type: 'UPDATE_CURRENT_QUERY';
  payload: ContextType['currentQuery']['query'];
};

type Action = UpdateCurrentQueryAction;

export default createContext<ContextType>({
  currentQuery: { query: null, queryId: null },
});

export function reducer(state: ContextType, { type, payload }: Action) {
  switch (type) {
    case 'UPDATE_CURRENT_QUERY':
      let queryId: string | null = null;
      if (payload) {
        queryId = uuidv4();
      }
      return {
        currentQuery: {
          ...state.currentQuery,
          query: payload,
          queryId,
        },
      };
    default:
      throw new Error();
  }
}
