import { Leaf } from '@wonderlandlabs/forest/lib/Leaf'
import { FormEvent } from 'react'
import axios from 'axios'

export type UserLoginStateValue = {
  email: string,
  password: string,
  password2: string,
  showLogin: boolean,
  showPasswords: boolean,
}

type RespondyError = {
  response: {
    data: {
      error: {
        message: string
      }
    }
  }
}

function isRespondyError(arg: unknown): arg is RespondyError {
  return !!(arg && typeof arg === 'object' && 'response' in arg);
}

export default (globalState: Leaf | null) => ({
  $value: {
    email: '',
    password: '',
    password2: '',
    showLogin: false,
    joinError: '',
    showPasswords: false
  },

  actions: {
    joinable(leaf: Leaf) {
      const { email, password, password2 } = leaf.value as UserLoginStateValue;
      const joinable = !!(email && password && password2);
      return joinable;
    },
    logInnable(leaf: Leaf) {
      const { email, password, password2 } = leaf.value as UserLoginStateValue;
      return !!(email && password);
    },
    reset(leaf: Leaf) {
      leaf.do.set_email('');
      leaf.do.set_password('');
      leaf.do.set_password2('');
      leaf.do.set_joinError('');
    },
    initLogin(leaf: Leaf) {
      leaf.do.set_showLogin(true);
      leaf.do.reset();
    },
    changeEmail(leaf: Leaf, e: FormEvent<HTMLInputElement>) {
      const next = (e.target as HTMLInputElement).value;
      leaf.do.set_email(next)
    },
    changePassword(leaf: Leaf, e: FormEvent<HTMLInputElement>) {
      const next = (e.target as HTMLInputElement).value;
      leaf.do.set_password(next)
    },
    toggleShowPasswords(leaf: Leaf) {
      leaf.do.set_showPasswords(!leaf.value.showPasswords);
    },
    changePassword2(leaf: Leaf, e: FormEvent<HTMLInputElement>) {
      const next = (e.target as HTMLInputElement).value;
      leaf.do.set_password2(next)
    },

    async login(leaf: Leaf) {
      try {
        const response = await axios.post('/api/user/login', {
          email: leaf.value.email,
          password: leaf.value.password
        });

        if (response.data?.error) {
          leaf.do.set_joinError(response.data.error.message);
        } else {
          globalState?.do.login(response.data.data.user);
          globalState?.do.addMessage({ text: 'Welcome Back!', status: 'ok' });
          leaf.do.set_showLogin(false);
        }

      } catch (err) {
        if (isRespondyError(err)) {
          if (err?.response?.data?.error) {
            leaf.do.set_joinError(err.response.data.error.message);
          } else {
            leaf.do.set_joinError('cannot log in');
          }
        }
      }
    },

    async join(leaf: Leaf) {
      try {
        const response = await axios.post('/api/user/signup', {
          email: leaf.value.email,
          password: leaf.value.password
        });

        if (response.data?.error) {
          leaf.do.set_joinError(response.data.error.message);
        } else {
          globalState?.do.addMessage({ text: 'You have successfully joined. Check your email.', status: 'ok' });
          leaf.do.set_showLogin(false);
        }

      } catch (err) {
        if (isRespondyError(err)) {
          leaf.do.set_joinError(err.response.data.error.message);
        } else {
          leaf.do.set_joinError('cannot join');
        }
      }

    }
  }
})
