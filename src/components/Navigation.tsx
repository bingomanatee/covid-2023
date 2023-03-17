import { Nav, Box } from 'grommet'
import Link from 'next/link'
import { Globe, Home } from 'grommet-icons'
import UserLogin from '~/components/UserLogin'
import IconPair from './IconPair'
import { useContext } from 'react'
import { GlobalStateContext } from '~/components/GlobalState'
import Image from 'next/image'

export default function Navigation() {
  const { value } = useContext(GlobalStateContext)
  return (
    <Nav pad="small" direction="row">
      <Box direction="row" justify="between" fill="horizontal">
        <Box direction="row" gap="large">
          <Link href={"/"}>
            <IconPair icon={<Home/>}>Home</IconPair>
          </Link>
          <Link href={"/charts/countries"}>
            <IconPair icon={<Globe/>}>countries</IconPair>
          </Link>
          {value.user && <>
            </>
          }
        </Box>
        <UserLogin/>
      </Box>
    </Nav>
  )
}
