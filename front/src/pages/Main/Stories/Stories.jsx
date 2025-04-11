import { useState } from 'react'
import StoriesHeader from '../../../components/StoriesHeader/StoriesHeader'
import StoriesList from '../../../components/StoriesList/StoriesList'
import classes from './Stories.module.css'

const Stories = () => {
  const [searchInput, setSearchInput] = useState('')

  return (
    <div className={classes.storiesContainer}>
        <StoriesHeader
          searchInput={searchInput}
          setSearchInput={setSearchInput}/>
        <StoriesList searchInput={searchInput} />
    </div>
  )
}

export default Stories