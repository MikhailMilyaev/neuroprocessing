import { useEffect, useState } from "react"
import { Flex, Spin } from "antd"
import { stories } from "../../stories"
import StoryCard from "../StoryCard/StoryCard"
import StoryModal from "../StoryModal/StoryModal"

const StoriesList = ({ searchInput} ) => {
  const [storiesList, setStoriesList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0})

  const filteredStories = searchInput.trim() ? storiesList.filter((story) => story.title.toLowerCase().includes(searchInput.toLowerCase())) : storiesList

  const activeStories =  filteredStories.filter((story) => !story.archive) 
  const archiveStories = filteredStories.filter((story) => story.archive)
  

  useEffect(() => {
      setIsLoading(true)
      setTimeout(() => {
        setStoriesList(stories)
        setIsLoading(false)
      }, 500)
  }, [])

  const handleContextMenu = (event) => {
    event.preventDefault()
    setModalPosition({ x: event.clientX, y: event.clientY})
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      {isLoading ? <Flex vertical style={{marginTop: '70px'}}><Spin /></Flex> : <>
        {activeStories.length === 0 ? <h2 style={{marginTop: '40px'}}>Историй нет</h2> : <h2 style={{marginTop: '20px', marginBottom: '15px'}}>Истории</h2>}
        {activeStories.map((story) => <div key={story.id} onContextMenu={(e) => handleContextMenu(e)}><StoryCard  {...story}/></div>)}
        {archiveStories.length === 0 ? <h2 style={{marginTop: '20px', marginBottom: '15px'}}>Архив пуст</h2> : <h2 style={{marginTop: '20px', marginBottom: '15px'}}>Архив</h2>}
        {archiveStories.map((story) => <div key={story.id} onContextMenu={(e) => handleContextMenu(e)}><StoryCard  {...story}/></div>)} 

        {isModalOpen && <StoryModal open={isModalOpen} position={modalPosition} onClose={handleCloseModal}/>}
      </>}
    </>

  )
}

export default StoriesList