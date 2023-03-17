import { withSize } from 'react-sizeme';
import SizeContext from './SizeContext';
import { GlobalStateContext } from './GlobalState';
import { GenericPageProps } from '~/types'
import { useEffect } from 'react'

type Props = { state?: any, size?: { width: number, height: number, dynHeight: number } } & GenericPageProps

function Internal({ state, size, children }: Props) {

  useEffect(() => {
    if (state && size?.width && size?.height) {
      state.do.setWidth(size.width);
      state.do.setHeight(size.height);
    }
  }, [size, state]);
  return (
    <div id="wll-container" className="wll-container">
      <SizeContext.Provider value={size}>{children}</SizeContext.Provider>
    </div>
  );
}

function Sizer({ size, children }: Props) {
  return (
    <GlobalStateContext.Consumer>
      {({ state }) => {
        return <Internal state={state} size={size}>{children}</Internal>
      }}
    </GlobalStateContext.Consumer>
  );
}

export default withSize({ monitorHeight: true, monitorWidth: true })(Sizer);
