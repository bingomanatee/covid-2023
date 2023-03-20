import { Leaf } from '@wonderlandlabs/forest/lib/Leaf'
import { GlobalStateValue, Message, UserObj } from '~/types'
import { v4 } from 'uuid'
import dayjs from 'dayjs'
const PLAY_TIME = 20;
const TODAY = dayjs();
const START_DATE = dayjs(new Date(2020, 0, 1));
const UNIX_SPAN = TODAY.unix() - START_DATE.unix();

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
  const initial: GlobalStateValue = { user,
    zoom: 250,
    time: 0,
    height: 0,
    animationStartTime: null,
    playing: false,
    currentTime: START_DATE,
    endDate: TODAY,
    messages: [] }
  return (
    {
      $value: initial,
      actions: {
        play(leaf: Leaf) {
          const progress  = leaf.do.progress();
          const progressSeconds = PLAY_TIME * progress;
          const newAnimationStartTime = dayjs().subtract(progressSeconds, 's');
          leaf.do.set_animationStartTime(newAnimationStartTime.toDate());

          leaf.do.set_playing(true);
          leaf.do.animate();
        },
        rewind(leaf: Leaf) {
          leaf.do.stop();
          leaf.do.set_currentTime(START_DATE);
        },
        stop(leaf: Leaf) {
          leaf.do.set_playing(false);
        },
        progress(leaf: Leaf) {
          if (!leaf.value.playing) {
            return (leaf.value.currentTime.unix() - START_DATE.unix()) / (UNIX_SPAN);
          }

          const secondsSinceStart = (leaf.value.time - leaf.value.animationStartTime) / 1000.0;
          return secondsSinceStart / PLAY_TIME;
        },
        progressClamped(leaf: Leaf) {
          return Math.min(1, leaf.do.progress());
        },
        animate(leaf: Leaf) {
          if (!leaf.value.playing) {
            return;
          }
          leaf.do.set_time(Date.now());

          const progress = leaf.do.progress();
          if (progress > 1) {
            leaf.do.set_currentTime(TODAY);
            leaf.do.set_playing(false);
            return;
          }

          leaf.do.set_currentTime(dayjs.unix(START_DATE.unix() + progress * UNIX_SPAN));
          requestAnimationFrame(leaf.do.animate);
        },

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
