import { $authHost } from './index'

export const listIdeas = async (storyId) => {
  const { data } = await $authHost.get(`/api/idea/story/${storyId}`)
  return data
}

export const createIdea = async (storyId, payload = {}) => {
  const { data } = await $authHost.post(`/api/idea/story/${storyId}`, payload)
  return data
}

export const updateIdea = async (id, payload = {}) => {
  const { data } = await $authHost.patch(`/api/idea/${id}`, payload)
  return data
}

export const deleteIdea = async (id) => {
  const { data } = await $authHost.delete(`/api/idea/${id}`)
  return data
}
