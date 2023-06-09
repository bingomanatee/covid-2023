import { Nav, Box, ResponsiveContext, Menu, Heading } from 'grommet'
import Link from 'next/link'
import { Globe, Home, Menu as MenuIcon } from 'grommet-icons'
import IconPair from './IconPair'
import { useContext } from 'react'
import { GlobalStateContext } from '~/components/GlobalState'
import ZoomControl from '~/components/ZoomControl'
import HeightControl from '~/components/HeightControl'
import { useRouter } from 'next/router'

export default function Navigation() {
  const { value } = useContext(GlobalStateContext);
  const size = useContext(ResponsiveContext);
  const router = useRouter();
  return (
    <>
      <Nav pad="small" direction="row">
        <Box direction="row" justify="between" fill="horizontal">
          {size === 'large' ? (
              <Box direction="row" gap="large">
                <Link href={"/"}>
                  <IconPair icon={<Home/>}>Home</IconPair>
                </Link>
                {value.user ? <Link href={"/charts/countries"}>
                  <IconPair icon={<Globe/>}>Countries</IconPair>
                </Link> : ''}
              </Box>
            )
            : (<Menu style={{ zIndex: 1000 }} margin="0" items={[
              {
                icon: <Home/>,
                label: 'Home',
                onClick() {
                  router.push('/');
                }
              },
              {
                icon: <Globe/>,
                label: 'Countries',
                onClick() {
                  router.push('/countries');
                }
              }
            ]}>
              <MenuIcon/>
            </Menu>)
          }
          {(size === 'small') ? "" : (
            <Box flex>
              <Heading textAlign="center" level="1">Covid mortality over time</Heading>
            </Box>
          )}
          <Box direction="row" gap="medium">
            <ZoomControl/>
            <HeightControl/>
          </Box>
        </Box>
      </Nav>
      {(size !== 'small') ? "" : (
        <Heading textAlign="center" level="1">Covid mortality over time</Heading>
      )}
    </>
  )
}
