import { ReactNode } from 'react'
import { ReactNodeArray } from 'prop-types'
import { Dayjs } from 'dayjs'

export type Country = {
  id: string,
  iso3: string,
  latitude: number | null,
  longitude: number | null,
  population: number | null
}
export type Message = {
  text: string,
  id?: string,
  timeout?: number | false,
  status: string
}

export type stateOrCountry = 'state' | 'country'

export type GenericPageProps = { children: ReactNode | ReactNodeArray | null };

export type UserObj = {
  email: string,
  aud: string,
  id: string
}

export type GlobalStateValue = {
  time: number,
  height: number,
  user?: UserObj,
  zoom: number,
  animationStartTime: Dayjs | null,
  currentTime: Dayjs,
  endDate: Dayjs,
  playing: boolean,
  messages: Message[]
}
