import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { sendWelcomeEmail } from '../utils/emailService.js'

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const userExists = await User.findOne({ email })
    if (userExists) return res.status(400).json({ message: 'User already exists' })

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hashedPassword })
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' })

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, name).catch(err => 
      console.log('Welcome email failed:', err.message)
    )

    res.status(201).json({ _id: user._id, name: user.name, email: user.email, token })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email })
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' })
      res.json({ _id: user._id, name: user.name, email: user.email, token })
    } else {
      res.status(401).json({ message: 'Invalid credentials' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    if (user) res.json(user)
    else res.status(404).json({ message: 'User not found' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}
