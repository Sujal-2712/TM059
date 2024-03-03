const mongoose = require('mongoose');

const ConnectDB = async() =>{
    const connection = await mongoose.connect('mongodb://127.0.0.1:27017/hospitals');
}

ConnectDB().then(
    console.log("Database Connections Successfully.....")
)
.catch((err)=> {
    console.log("Connection is Not established ",err);
})




