import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'

export const register = async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const user = await User.create({
      email: req.body.email,
      password: hashedPassword,
      role: req.body.role || 'public',
    })
    res.status(201).json(user)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const login = async (req, res) => {
  try {
    console.log('req.body:', req.body)
    const user = await User.findOne({ where: { email: req.body.email } })
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )
    res.json({ token })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }

}
