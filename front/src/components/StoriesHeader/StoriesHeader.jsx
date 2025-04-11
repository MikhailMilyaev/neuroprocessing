import { useRef, useState } from "react"
import { Link } from "react-router-dom"
import StoryInput from "../StoryInput/StoryInput"
import Profile from "../Profile/Profile"
import classes from './StoriesHeader.module.css'
import ProfileModal from "../ProfileModal/ProfileModal"

const StoriesHeader = ({ searchInput, setSearchInput }) => {
  const profileButtonRef = useRef(null)
  const [profileMenu, setProfileMenu] = useState(false)
  const [profileMenuPosition, setProfileMenuPosition] = useState({ x: 0, y: 0})

  const handleProfileModal = () => {
    const rect = profileButtonRef.current.getBoundingClientRect()
    setProfileMenuPosition({ x: rect.right + 10, y: rect.top })
    setProfileMenu(true)
  }

  const handleSearchChange = (event) => {
    setSearchInput(event.target.value)  
  }
  return (
    <div className={classes.storiesHeader}>
        <StoryInput value={searchInput} onChange={handleSearchChange}/>
        <Link to="/education" className={classes.buttonToEducation}>Обучение</Link>
        <button className={classes.buttonToAdd}>Добавить</button> 
        <div ref={profileButtonRef}>
        <Profile name="M" onClick={handleProfileModal} />
      </div>

        <ProfileModal open={profileMenu} onClose={() => setProfileMenu(false)} position={profileMenuPosition}/>
    </div>
  )
}

export default StoriesHeader