const express = require('express');
require('dotenv').config();
const app = express();

app.use(require('cors')());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

const connectionToDatabase = require('./config/mongoose');
const itemRoutes = require('./routes/itemRoutes');
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const friendRoutes = require('./routes/friendRoutes');
const messageRoutes = require('./routes/messageRoutes');
const commentRoutes = require('./routes/commentRoutes');

app.use('/api', itemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/comments', commentRoutes);

//initializing connection
connectionToDatabase();

app.listen(process.env.PORT || 5000, () => {
    console.log("Listening to port : ", process.env.PORT || 5000);
});