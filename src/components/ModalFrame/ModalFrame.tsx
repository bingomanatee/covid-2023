import { Box, Button, Heading, ResponsiveContext } from 'grommet'
import React, { ReactNode, useContext } from 'react'
import { GenericPageProps } from '@lib/types'
import Image from 'next/image'
import styles from './ModalFrame.module.scss';

export default function ModalFrame({
                                     size,
                                     children,
                                     heading,
                                     close
                                   }: { size?: number, heading?: string | ReactNode, close?: () => void } & GenericPageProps) {
  const resSize = useContext(ResponsiveContext);

  return (
    <Box background="modal-popup"
         pad="large"
         style={{ position: 'relative' }}
         width={resSize === 'large' ? `${size || 600}px` : '100vw'}
         fill={resSize === 'large' ? undefined : true}>
      {heading && (<Heading level={2}>
          {heading}
        </Heading>
      )}
      {children}
      {close && <Button onClick={close} className={styles.closeButton} plain icon={
        <Image src="/img/icons/close.svg" alt={'close'} width={20} height={20}/>
      }
      />}
    </Box>
  )
}
