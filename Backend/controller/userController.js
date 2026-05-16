const {createUser, getUserByEmail} = require('../service/userService');

const addUser = async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    try {
        console.log('Checking if user already exists with email:', email);
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const user = await createUser({ username, email, password });
        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user' });
    }
};

module.exports = {
    addUser
};