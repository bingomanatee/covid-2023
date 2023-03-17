import React from 'react';

type SizeData = {
  height: number,
  width: number,
  dynHeight: number
}

const sizeContext = React.createContext<SizeData | undefined>({
  height: 0,
  width: 0,
  dynHeight: 100,
});

export default sizeContext;
