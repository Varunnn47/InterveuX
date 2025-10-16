// src/pages/ResumeHistory.jsx
import { useEffect, useState } from 'react'
import api from '../lib/api'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '../utils/motion'

const ResumeHistory = () => {
  const [list, setList] = useState([])

  useEffect(() => {
    ;(async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        const res = await api.get(`/api/resume/${user.id}`)
        setList(res.data)
      } catch (err) {
        console.error(err)
      }
    })()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="max-w-5xl mx-auto">
        <motion.h1 variants={fadeInUp} className="text-3xl font-bold mb-6">Resume History</motion.h1>
        <div className="space-y-4">
          {list.map((it) => (
            <motion.div key={it._id} variants={fadeInUp} className="bg-white p-4 rounded shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{it.resumeData}</div>
                  <div className="text-sm text-gray-500">Score: {it.analysis?.overallScore || 'N/A'}%</div>
                </div>
                <div className="text-sm text-gray-500">{new Date(it.createdAt).toLocaleString()}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default ResumeHistory
