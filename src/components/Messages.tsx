import { GlobalStateContext } from '~/components/GlobalState'
import { useContext, useMemo } from 'react'
import { Message } from '~/types'
import { Box, Layer, ResponsiveContext, Text } from 'grommet'

function MessageButton({ msg }: { msg: Message }) {
  return (
    <Box margin="large" pad="medium" border={{
      size: '4px',
      color: `status-${msg.status}`
    }}>
      <Text size="large">{msg.text} </Text>
    </Box>
  )
}

export default function Messages() {
  const { value, state } = useContext(GlobalStateContext);
  const size = useContext(ResponsiveContext)
  const messages = useMemo(() => {
    return value.messages;
  }, [value.messages]);

  if (!messages?.length) {
    return null;
  }

  return (
    <Layer position="bottom-right" modal={false} background="rgba(0,0,0,0)">
      <Box direction={size === 'small' ? 'column' : 'row'}>

        {messages.map((msg: Message, index) => <MessageButton msg={msg} key={msg.id}/>)}

      </Box>

    </Layer>
  )
}
