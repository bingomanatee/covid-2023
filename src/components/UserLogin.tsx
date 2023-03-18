import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Box, Button, Heading, Layer, Menu, ResponsiveContext, Tab, Tabs, TextInput } from 'grommet'
import { User } from 'grommet-icons'
import IconPair from '~/components/IconPair'
import { Forest } from '@wonderlandlabs/forest'
import { Leaf } from '@wonderlandlabs/forest/lib/Leaf'
import FormItem from '~/components/FormItem'
import { FormView } from 'grommet-icons'
import ErrorMessage from '~/components/ErrorMessage'
import ModalFrame from '~/components/ModalFrame'
import userLoginState, { UserLoginStateValue } from '~/lib/userLoginState'
import { GlobalStateContext } from '~/components/GlobalState'

type LoginFormProps = {
  state: Leaf
}

function LoginForm({ state }: LoginFormProps) {

  return (state && <Layer background="modal-background" modal>
    <ModalFrame size={600}>
      <Tabs>
        <Tab title="Sign In">
          <Heading level={2}>Log In</Heading>
          <FormItem label="User name">
            <TextInput name="email" type="email" value={state.value.email} onChange={state.do.changeEmail}/>
          </FormItem>
          <FormItem label="Password">
            <>
              <TextInput name="password" value={state.value.password}
                         type={state.value.showPasswords ? 'text' : "password"}
                         onChange={state.do.changePassword}/>
              <Button onClick={state.do.toggleShowPasswords}><FormView/></Button>
            </>
          </FormItem>

          {state.value.joinError && <ErrorMessage>{state.value.joinError}</ErrorMessage>}

          <FormItem label={<>&nbsp;</>}>
            <Button disabled={!state.do.logInnable()} onClick={state.do.login} primary plain={false}>Log In</Button>
          </FormItem>
        </Tab>

        <Tab title="New Account">
          <Heading level={2}>Log In</Heading>
          <FormItem label="Email Address">
            <TextInput name="email" type="email" value={state.value.email} onChange={state.do.changeEmail}/>
          </FormItem>
          <FormItem label="Password">
            <>
              <TextInput name="password" value={state.value.password}
                         type={state.value.showPasswords ? 'text' : "password"}
                         onChange={state.do.changePassword}/>
              <Button onClick={state.do.toggleShowPasswords}><FormView/></Button>
            </>
          </FormItem>
          <FormItem label="Password2">
            <>
              <TextInput name="password2" value={state.value.password2}
                         type={state.value.showPasswords ? 'text' : "password"}
                         onChange={state.do.changePassword2}/>
              <Button onClick={state.do.toggleShowPasswords}><FormView/></Button>
            </>
          </FormItem>

          {state.value.joinError && <ErrorMessage>{state.value.joinError}</ErrorMessage>}

          <FormItem label={<>&nbsp;</>}>
            <Button disabled={!state.do.joinable()} onClick={state.do.join} primary plain={false}>Join</Button>
          </FormItem>
        </Tab>
      </Tabs>
    </ModalFrame>

  </Layer>)
}

export default function UserLogin() {
  const [value, setValue] = useState<UserLoginStateValue>({
    password: '',
    password2: '',
    showLogin: false,
    showPasswords: false,
    email: ''
  });
  const { state: globalState, value: globalValue } = useContext(GlobalStateContext)

  const state = useMemo(() => new Forest(userLoginState(globalState)), [globalState]);

  useEffect(() => {
    const sub = state.subscribe(setValue);
    return () => sub.unsubscribe();
  }, [state]);


  if (globalValue?.user) {
    console.log('logged in as ', globalValue?.user);
    const head = `Logged in as ${globalValue.user.email.replace(/^([^@]+)@(.{3}).*/,
      (match: string, name: string, suffix: string) => `${name}@${suffix}...`)}`
    return <IconPair icon={<User color="grey"/>}>
      <Menu
        label={head}
        items={[
          { label: 'Log Out', onClick: globalState?.do.logout }
        ]}
      />

    </IconPair>
  }

  return (
    <>
      {
        value.showLogin && <LoginForm state={state}/>
      }
      <Button plain onClick={state.do.initLogin}>
        <IconPair icon={<User/>}>
          Log In
        </IconPair>
      </Button>
    </>
  )
}
