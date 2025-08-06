import bcrypt from 'bcrypt';
import People from '../models/People.js';
import Spec from '../models/Spec.js';

export const register = async (req, res) => {
  const { email, password, role } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    if (role === 'public') {
      const newUser = new People({ email, password: hashedPassword });
      await newUser.save();
    } else if (role === 'responder') {
      const newSpec = new Spec({ email, password: hashedPassword });
      await newSpec.save();
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user', error: err });
  }
};
