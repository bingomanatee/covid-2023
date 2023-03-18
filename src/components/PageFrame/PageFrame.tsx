import { Grid, Grommet, Main } from 'grommet'
import Sizer from '~/components/Sizer'
import Navigation from '~/components/Navigation'
import GlobalState from '~/components/GlobalState'
import Header from '~/components/PageHeader'
import Messages from '~/components/Messages'
import { GenericPageProps } from '~/types'
import theme from './grommet-theme';

export default function PageFrame({ children }: GenericPageProps) {
  return (<Grommet theme={theme}>
    <GlobalState>
        <Grid
          rows={['auto', 'auto', 'flex']}
          columns={['100%']}
          gap="none"
          areas={[
            { name: 'header', start: [0, 0], end: [0, 0] },
            { name: 'nav', start: [0, 1], end: [0, 1] },
            { name: 'main', start: [0, 2], end: [0, 2] },
          ]}
          height="100vh"
        >
          <Header/>
          <Navigation/>
          <Main gridArea="main"  fill overflow="auto">
              {children}
            <Messages />
          </Main>
        </Grid>
    </GlobalState>
  </Grommet>)
}
