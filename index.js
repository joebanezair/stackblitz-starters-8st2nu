const express = require('express');
require('dotenv').config();
const app = express();

app.use(require('cors')());
app.use(express.json());
const connectionToDatabase = require('./config/mongoose');
const itemRoutes = require('./routes/itemRoutes');

app.use('/api', itemRoutes);

//initializing connection
connectionToDatabase();

app.listen(process.env.PORT, () => {
    console.log("Listening to port : ", process.env.PORT || 5000);
})