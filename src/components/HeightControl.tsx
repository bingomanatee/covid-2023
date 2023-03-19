import { Box, RangeInput, Text } from "grommet";
import Image from 'next/image'
import { useCallback, useContext } from 'react'
import { Global } from '@jest/types'
import { GlobalStateContext } from '~/components/GlobalState'

const MAX = 80;
const MIN = -80;
export default function HeightControl() {
  const { value, state } = useContext(GlobalStateContext);

  return <Box width="200px" direction="row" gap="small" justify="between">
    <Image src="/img/icons/height-high.svg" width="20" height="20" alt="oom-out"/>
    <Box direction={'row'}>
      <RangeInput min={MIN} max={MAX} step={10} value={value.height} onChange={
      (change) => {
        state?.do.set_height(Number(change.target.value))
      }
    }/>
      <Text size="small">{value.height}</Text>
    </Box>
    <Image onClick={() => state?.do.set_zoom(MAX)} src="/img/icons/height-low.svg" width="20" height="20" alt="oom-out"/>
  </Box>

}
