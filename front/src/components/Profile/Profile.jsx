import classes from './Profile.module.css'

const Profile = ({ name, onClick}) => {
  const firstLetter = name ? name.charAt(0).toUpperCase() : 'M';

  return (
    <button onClick={onClick} className={classes.profileButton}>{firstLetter}</button>
  )
}

export default Profile