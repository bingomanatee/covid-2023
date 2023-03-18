import { Text } from 'grommet'
import { GenericPageProps } from '~/types'

export default function ErrorMessage({ children }: GenericPageProps) {

  return children ? (<section>
    <Text color="status-critical">{children}</Text>
  </section>) : null;
}
