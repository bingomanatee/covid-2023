import { Forest } from '@wonderlandlabs/forest';
import { createContext, useEffect, useMemo, useState } from 'react'
import { Leaf } from '@wonderlandlabs/forest/lib/Leaf'
import { GenericPageProps, GlobalStateValue } from '~/types'
import globalStateConfig from '~/lib/globalStateConfig'

// @ts-ignore
export const GlobalStateContext = createContext<{ value: GlobalStateValue, state: Leaf }>({});

export default function GlobalState({ children }: GenericPageProps) {

  const state = useMemo(() => new Forest(globalStateConfig()), []);

  const [value, setValue] = useState<GlobalStateValue>(state.value);

  useEffect(() => {
    const sub = state.subscribe(setValue);
    return () => sub.unsubscribe();
  }, [state]);

  return <GlobalStateContext.Provider value={{ state, value }}>{children}</GlobalStateContext.Provider>
}
