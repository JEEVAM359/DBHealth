const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const twilio = require("twilio");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

/* Twilio initialized lazily inside sendFallSMS */

/* MongoDB connection */

mongoose.connect(process.env.MONGODB_URI)
.then(()=> console.log("MongoDB Connected"))
.catch(err => console.log(err));

/* Schema */

const loginSchema = new mongoose.Schema({
name:String,
email:{type:String,unique:true},
bikeNumber:String,
deviceId:String,
password:String,
heartRate:{type:Number,default:75},
temperature:{type:Number,default:37.0},
stressLevel:{type:String,default:"Normal"},
workTime:{type:Number,default:0}
});

const Login = mongoose.model("logins", loginSchema);

const notificationSchema = new mongoose.Schema({
requesterId: String,
requesterName: String,
bikeNumber: String,
heartRate: Number,
temperature: Number,
workTime: Number,
reason: String,
status: {type: String, default: 'pending'},
createdAt: {type: Date, default: Date.now}
});

const Notification = mongoose.model("notifications", notificationSchema);

const esp32Schema = new mongoose.Schema({
deviceId: String,
temperature: Number,
bpm: Number,
motion: Number,
fall: {type: Boolean, default: false},
latitude: Number,
longitude: Number,
timestamp: {type: Date, default: Date.now}
});

const ESP32Data = mongoose.model("esp32data", esp32Schema);

/* Send fall alert SMS */
async function sendFallSMS(deviceId, temperature, bpm, latitude, longitude){
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE;
  const to = process.env.ALERT_PHONE;

  console.log('=== SMS DEBUG ===');
  console.log('SID:', sid);
  console.log('FROM:', from);
  console.log('TO:', to);

  if(!sid || sid.includes('YOUR') || !token || token.includes('YOUR') || !from || from.includes('YOUR')){
    console.log('ERROR: Twilio credentials not set in .env file!');
    return;
  }

  const mapsLink = (latitude && longitude)
    ? `https://maps.google.com/?q=${latitude},${longitude}`
    : 'Location unavailable';

  try{
    const client = twilio(sid, token);
    const msg = await client.messages.create({
      body: `FALL DETECTED! Device: ${deviceId} Temp: ${temperature}C HR: ${bpm} BPM Location: ${mapsLink} Please check worker immediately!`,
      from: from,
      to: to
    });
    console.log('SMS sent! SID:', msg.sid);
  }catch(smsErr){
    console.log('SMS ERROR:', smsErr.message);
    console.log('SMS ERROR CODE:', smsErr.code);
  }
}

/* ESP32 Data Receive — matches exact JSON fields from ESP32 */

app.post("/api/sensor", async (req,res)=>{
try{
console.log("=== ESP32 POST /api/sensor ===");
console.log("Body:", JSON.stringify(req.body));
const {temperature, bpm, motion, fall, latitude, longitude} = req.body;
if(temperature === undefined && bpm === undefined){
  return res.status(400).json({error:"Empty body - set Content-Type: application/json"});
}
const deviceId = req.body.deviceId || "esp32_device_01";
const data = new ESP32Data({deviceId, temperature, bpm, motion, fall, latitude, longitude});
await data.save();
if(fall) await sendFallSMS(deviceId, temperature, bpm, latitude, longitude);
res.json({message:"Data received", data});
}catch(err){
console.log("ERROR saving:", err.message);
res.status(500).json({error:"Failed to save ESP32 data"});
}
});

/* Keep old endpoint as alias */
app.post("/api/esp32/data", async (req,res)=>{
try{
const {temperature, bpm, motion, fall, latitude, longitude} = req.body;
const deviceId = req.body.deviceId || "esp32_device_01";
const data = new ESP32Data({deviceId, temperature, bpm, motion, fall, latitude, longitude});
await data.save();
if(fall) await sendFallSMS(deviceId, temperature, bpm, latitude, longitude);
res.json({message:"Data received", data});
}catch(err){
console.log(err);
res.status(500).json({error:"Failed to save ESP32 data"});
}
});

/* Get absolute latest ESP32 data (no deviceId needed) */

app.get("/api/esp32/latest", async (req,res)=>{
try{
const data = await ESP32Data.findOne().sort({timestamp: -1});
if(!data) return res.status(404).json({error:"No data found"});
res.json(data);
}catch(err){
console.log(err);
res.status(500).json({error:"Failed to fetch ESP32 data"});
}
});

/* Get Latest ESP32 Data by deviceId */

app.get("/api/esp32/latest/:deviceId", async (req,res)=>{
try{
const data = await ESP32Data.findOne({deviceId: req.params.deviceId}).sort({timestamp: -1});
if(!data) return res.status(404).json({error:"No data found"});
res.json(data);
}catch(err){
console.log(err);
res.status(500).json({error:"Failed to fetch ESP32 data"});
}
});

/* Get Latest ESP32 Data by userId (looks up worker's deviceId first) */

app.get("/api/esp32/latest-by-user/:userId", async (req,res)=>{
try{
const worker = await Login.findById(req.params.userId, {deviceId:1});
if(!worker || !worker.deviceId) return res.status(404).json({error:"No deviceId linked to this worker"});
const data = await ESP32Data.findOne({deviceId: worker.deviceId}).sort({timestamp: -1});
if(!data) return res.status(404).json({error:"No ESP32 data found"});
res.json(data);
}catch(err){
console.log(err);
res.status(500).json({error:"Failed to fetch ESP32 data"});
}
});

/* Signup */

app.post("/api/auth/signup", async (req,res)=>{

try{

const {name,email,bikeNumber,deviceId,password} = req.body;

const exist = await Login.findOne({email});
if(exist) return res.status(400).json({error:"Email already exists"});

const user = new Login({name,email,bikeNumber,deviceId,password});
await user.save();

res.json({message:"Signup success"});

}catch(err){

console.log(err);
res.status(500).json({error:"Signup failed"});

}

});

/* Login */

app.post("/api/auth/login", async (req,res)=>{

try{

const {email,password} = req.body;

const user = await Login.findOne({email});

if(!user){
return res.status(400).json({error:"User not found"});
}

const match = (password === user.password);

if(match){
res.json({
message:"Login success",
token:"dummy_token_" + user._id,
name:user.name,
email:user.email,
bikeNumber:user.bikeNumber,
userId:user._id
});
}else{
res.status(400).json({error:"Wrong password"});
}

}catch(err){

res.status(500).json({error:"Login error"});

}

});

/* Get all workers/users */

app.get("/api/workers", async (req,res)=>{

try{

const users = await Login.find({}, {password: 0});

res.json(users);

}catch(err){

console.log(err);
res.status(500).json({error:"Failed to fetch workers"});

}

});

/* Get worker by userId */

app.get("/api/workers/:userId", async (req,res)=>{

try{

const user = await Login.findById(req.params.userId, {password: 0});

if(!user){
return res.status(404).json({error:"Worker not found"});
}

res.json(user);

}catch(err){

console.log(err);
res.status(500).json({error:"Failed to fetch worker"});

}

});

/* Update worker health data */

app.post("/api/workers/:userId/health", async (req,res)=>{

try{

const {heartRate,temperature,stressLevel,workTime} = req.body;

const user = await Login.findByIdAndUpdate(
req.params.userId,
{heartRate,temperature,stressLevel,workTime},
{new:true}
);

res.json({message:"Health data updated",data:user});

}catch(err){

console.log(err);
res.status(500).json({error:"Failed to update health data"});

}

});

/* Request Order Reassignment */

app.post("/api/reassignment/request", async (req,res)=>{

try{

console.log('Reassignment request received:', req.body);

const {userId, userName, email, bikeNumber, heartRate, temperature, workTime, reason} = req.body;

if(!userId || !userName || !reason){
return res.status(400).json({error:"Missing required fields"});
}

// Delete old notifications from this user
await Notification.deleteMany({requesterId: userId});

// Create notification for all other users
const allUsers = await Login.find({_id: {$ne: userId}});

console.log('Found users:', allUsers.length);

for(let user of allUsers){
const notification = new Notification({
requesterId: userId,
requesterName: userName,
bikeNumber: bikeNumber,
heartRate: heartRate,
temperature: temperature,
workTime: workTime,
reason: reason
});
await notification.save();
}

console.log('Notifications created successfully');

res.json({message:"Reassignment request sent"});

}catch(err){

console.log('Error in reassignment request:', err);
res.status(500).json({error:"Failed to send request: " + err.message});

}

});

/* Get Notifications */

app.get("/api/notifications/:userId", async (req,res)=>{

try{

const notifications = await Notification.find({
requesterId: {$ne: req.params.userId},
status: 'pending'
});

res.json(notifications);

}catch(err){

console.log(err);
res.status(500).json({error:"Failed to fetch notifications"});

}

});

/* Accept Reassignment */

app.post("/api/reassignment/accept", async (req,res)=>{

try{

const {notificationId, accepterId, requesterId} = req.body;

// Update notification status
await Notification.findByIdAndUpdate(notificationId, {status: 'accepted'});

// Get both users' data
const accepter = await Login.findById(accepterId);
const requester = await Login.findById(requesterId);

// Calculate distance (mock coordinates for now)
const accepterLat = 11.0168;
const accepterLng = 76.9558;
const requesterLat = 11.0250;
const requesterLng = 76.9450;

const R = 6371;
const dLat = (requesterLat - accepterLat) * Math.PI / 180;
const dLon = (requesterLng - accepterLng) * Math.PI / 180;
const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(accepterLat * Math.PI / 180) * Math.cos(requesterLat * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
const distance = (R * c * 1.4).toFixed(2);
const time = Math.ceil(R * c * 1.4 * 2.5);

res.json({
message:"Order accepted",
distance: distance,
time: time,
accepterLat: accepterLat,
accepterLng: accepterLng,
requesterLat: requesterLat,
requesterLng: requesterLng,
requesterName: requester.name
});

}catch(err){

console.log(err);
res.status(500).json({error:"Failed to accept reassignment"});

}

});

/* Reject Reassignment */

app.post("/api/reassignment/reject", async (req,res)=>{

try{

const {notificationId} = req.body;

await Notification.findByIdAndUpdate(notificationId, {status: 'rejected'});

res.json({message:"Reassignment rejected"});

}catch(err){

console.log(err);
res.status(500).json({error:"Failed to reject reassignment"});

}

});

/* Server */

const PORT = process.env.PORT || 5002;

app.listen(PORT,()=>{
console.log("Server running on port",PORT);
});