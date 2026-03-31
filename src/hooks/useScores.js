import { useState, useEffect } from 'react'
import {
  subscribeToFolders,
  subscribeToScores,
  addFolder,
  deleteFolder,
  addScore,
  deleteScore,
} from '../services/firestore'

export function useFolders() {
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToFolders((data) => {
      setFolders(data)
      setLoading(false)
    })
    return unsub
  }, [])

  return { folders, loading, addFolder, deleteFolder }
}

export function useScoresInFolder(carpetaId) {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!carpetaId) return
    const unsub = subscribeToScores(carpetaId, (data) => {
      setScores(data)
      setLoading(false)
    })
    return unsub
  }, [carpetaId])

  return { scores, loading, addScore, deleteScore }
}
