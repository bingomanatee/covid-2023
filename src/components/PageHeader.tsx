import { Box, Header, Heading } from 'grommet'
import Image from 'next/image'

export default function PageHeader() {
  return (
    <Header background="brand" pad={{left: 'small', right: 'medium', top: 'small', bottom: 'small'}}>
        <Box>
          <Image src="/img/logo.png" alt="logo" height={50} width={50}/>
        </Box>
        <Heading level={1}>Covid Data</Heading>
    </Header>
  )
}
