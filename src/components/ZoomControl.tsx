import { Box, RangeInput, Text } from "grommet";
import Image from 'next/image'
import { useCallback, useContext } from 'react'
import { Global } from '@jest/types'
import { GlobalStateContext } from '~/components/GlobalState'

const MAX = 300;
const MIN = 150;
export default function ZoomControl() {
  const { value, state } = useContext(GlobalStateContext);

  return <Box width="200px" direction="row" gap="small" justify="between">
    <Image src="/img/icons/zoom-large.svg" width="20" height="20" alt="oom-out"/>
    <Box direction={'row'}>
      <RangeInput min={MIN} max={MAX} step={25} value={value.zoom} onChange={
      (change) => {
        state?.do.set_zoom(Number(change.target.value))
      }
    }/>
      <Text size="small">{value.zoom}</Text>
    </Box>
    <Image onClick={() => state?.do.set_zoom(MAX)} src="/img/icons/zoom-small.svg" width="20" height="20" alt="oom-out"/>
  </Box>

}
