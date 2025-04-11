import { createPortal } from 'react-dom'
import classes from './FullScreenLoader.module.css'
import { useEffect, useRef } from 'react'
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const FullScreenLoader = ({ isLoading }) => {
  const loader = useRef(null)

  useEffect(() => {
    if (isLoading) {
        loader.current.showModal()
    } else {
        loader.current.close()
    }
  }, [isLoading])

  return createPortal(
    <dialog className={classes.loader} ref={loader}>
        <Spin indicator={<LoadingOutlined spin />} size="large" />
    </dialog>,
    document.getElementById('authLoader')

  )
}

export default FullScreenLoader