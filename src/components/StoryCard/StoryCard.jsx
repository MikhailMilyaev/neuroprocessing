import classes from './StoryCard.module.css'

const StoryCard = ({ title }) => {

  return (
    <div className={classes.storiesList}>
      <button className={classes.storyCard}>{title}</button>
    </div>

  )
}

export default StoryCard