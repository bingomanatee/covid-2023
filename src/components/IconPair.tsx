import { Box, Text } from 'grommet'
import { GenericPageProps } from '~/types'
import { ReactElement } from 'react'

type Props = { icon: ReactElement<any, any> | null, color?: string } & GenericPageProps

export default function IconPair({ icon, children, color }: Props) {
  return (
    <Box direction="row" gap="small" alignContent="baseline">
      {icon}
      <Text color={color || "anchor"}>{children}</Text>
    </Box>
  )
}
