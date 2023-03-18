import { ReactNode, useContext } from 'react'
import { Box, Text, ResponsiveContext } from 'grommet'
import { GenericPageProps } from '~/types'


export default function FormItem({ children, label }: {label: string | ReactNode } & GenericPageProps) {
  const size = useContext(ResponsiveContext);

  if (size === 'small') {
    <Box direction="column" gap="small" align="baseline" margin={{ top: 'small', bottom: 'medium' }}>
      <Text>{label}</Text>
      {children}
    </Box>
  }

  return (
    <Box direction="row" gap="medium" align="baseline" margin={{ top: 'small', bottom: 'small' }}>
      <Box basis="50%" flex={true}>  <Text>{label}</Text></Box>
      {children}
    </Box>
  )
}
