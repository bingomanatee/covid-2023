import { withSize } from 'react-sizeme';
import SizeContext from './SizeContext';
import { GlobalStateContext } from './GlobalState';
import { GenericPageProps } from '~/types'
import { useEffect } from 'react'

type Props = { state?: any, size?: { width: number, height: number, dynHeight: number } } & GenericPageProps

function Internal({ size, children }: Props) {

  return (
    <div id="wll-container" className="wll-container">
      <SizeContext.Provider value={size}>{children}</SizeContext.Provider>
    </div>
  );
}

function Sizer({ size, children }: Props) {
  console.log('--- size:', size);
  return (
    <GlobalStateContext.Consumer>
      {({ state }) => {
        return <Internal state={state} size={size}>{children}</Internal>
      }}
    </GlobalStateContext.Consumer>
  );
}

export default withSize({ monitorHeight: true, monitorWidth: true })(Sizer);
