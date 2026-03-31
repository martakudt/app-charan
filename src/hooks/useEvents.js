import { useState, useEffect } from 'react'
import { subscribeToEvents, voteEvent, addEvent, updateEvent, deleteEvent } from '../services/firestore'

export function useEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToEvents((data) => {
      setEvents(data)
      setLoading(false)
    })
    return unsub
  }, [])

  return { events, loading, voteEvent, addEvent, updateEvent, deleteEvent }
}
