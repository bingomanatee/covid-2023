import { Forest } from '@wonderlandlabs/forest';
import { createContext, useEffect, useMemo, useState } from 'react'
import { Leaf } from '@wonderlandlabs/forest/lib/Leaf'
import { GenericPageProps, GlobalStateValue } from '~/types'
import globalStateConfig from '~/lib/globalStateConfig'


export const GlobalStateContext = createContext<{ state: Leaf | null, value: GlobalStateValue }>({
  state: null, value: {
    width: 0,
    height: 0,
    messages: []
  }
})

export default function GlobalState({ children }: GenericPageProps) {
  const [value, setValue] = useState<GlobalStateValue>({
    width: 0,
    height: 0,
    messages: []
  });

  const state = useMemo(() => {
        return new Forest(globalStateConfig())
      },
      []
    );

  useEffect(() => {
    const sub = state.subscribe(setValue);
    return () => sub.unsubscribe();
  }, [state]);

  return <GlobalStateContext.Provider value={{ state, value }}>{children}</GlobalStateContext.Provider>
}
