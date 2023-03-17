import { Leaf } from '@wonderlandlabs/forest/lib/Leaf'
import { Message, UserObj } from '~/types'
import { v4 } from 'uuid'

export default () => {
  const userString = typeof window !== 'undefined' ? window?.sessionStorage.getItem('user') : '';
  let user = null;
  if (userString) {
    try {
      user = JSON.parse(userString);
    } catch (err) {
      console.error('cannot parse user string', userString);
    }
  }
  return (
    {
      $value: { user, width: 0, height: 0, messages: [] },
      actions: {
        addMessage(leaf: Leaf, message: string | Message) {
          let text = message;
          let timeout: number | undefined | false = 5000;
          let status = 'error';
          if (typeof message === 'object') {
            text = message.text;
            status = message.status || 'error';
            if ('timeout' in message) {
              timeout = message.timeout === false ? 0 : message.timeout;
            }
          }
          if (text) {
            const newMessage = {
              id: v4(),
              text,
              status
            }
            leaf.do.set_messages([...leaf.value.messages, newMessage]);

            if (timeout) {
              setTimeout(() => {
                const found = leaf.value.messages.find((m: Message) => m.id === newMessage.id);
                if (found) {
                  leaf.do.set_messages(leaf.value.messages.filter((m: Message) => m.id !== newMessage.id));
                }
              }, timeout);
            }
          }
        },
        logout(leaf: Leaf) {
          leaf.do.set_user(null);
          window?.sessionStorage.removeItem('user');
          leaf.do.addMessage({text: 'Logged Out', status: 'ok'});
        },
        login(leaf: Leaf, user?: UserObj) {
          if (user) {
            leaf.do.set_user(user);
            try {
              window?.sessionStorage.setItem('user', JSON.stringify(user));
            } catch (err) {
              console.error('cannot serialize user:', user, err)
            }
          }
        }
      }
    })
}
