const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(bodyParser.json({ limit: '10mb' })); // Allow large payloads
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// MongoDB Connection
/*mongoose.connect('mongodb://localhost:27017/musicAnnotationApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});*/
// MongoDB Connection (uses environment variable)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Mongoose Schemas
const NoteSchema = new mongoose.Schema({
  x: Number,
  y: Number,
  tone: String, // Tone (e.g., "E4")
  duration: String, // Duration (e.g., "4")
});

const RestSchema = new mongoose.Schema({
  x: Number,
  y: Number,
  duration: String, // Duration (e.g., "4")
});

const StaffSchema = new mongoose.Schema({
    current_page: Number,
    initial_staff_click: [Number], // [x, y]
    margin_vertical: Number,
    final_staff_click: [Number], // [x, y]
    clef: String, // Clef (e.g., "treble")
    key: String, // (e.g., "")
    time: String, // Time signature (e.g., "2/4")
    notes: [NoteSchema], // Array of notes
    rests: [RestSchema], // Array of rests
    barlines: [Number], // Array of x-positions
    createdAt: { type: Date, default: Date.now },
});

const Staff = mongoose.model('Staff', StaffSchema);


const ImageSchema = new mongoose.Schema({
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }, // Reference to the staff object
    image: String, // Base64 string or file path
    createdAt: { type: Date, default: Date.now },
  });
  
const Image = mongoose.model('Image', ImageSchema);

// API Endpoints

// Save annotated staff data
app.post('/annotate-staff', async (req, res) => {
    const staffData = req.body;
    console.log(staffData);
    console.log(staffData[0].notes);
    console.log(staffData[0].rests);
    try {
    // Validate the data
        if (!Array.isArray(staffData) || staffData.length === 0) {
            console.log("Invalid data: Staff data should be a non-empty array.");
            throw new Error('Invalid data: Staff data should be a non-empty array.');
        }

        //console.log("Staff data is valid.");
        // Save each staff object to the database
        const savedStaffs = await Staff.insertMany(staffData);
        res.status(201).send({ success: true, count: savedStaffs.length });
    } catch (error) {
        console.log("Error: ", error.message);
        res.status(500).send({ success: false, error: error.message });
    }
});

app.post('/save-image', async (req, res) => {
    const { staffId, image } = req.body;
  
    try {
      if (!staffId || !image) {
        throw new Error('Staff ID and image are required.');
      }
  
      const newImage = new Image({ staffId, image });
      await newImage.save();
  
      res.status(201).send({ success: true, imageId: newImage._id });
    } catch (error) {
      res.status(500).send({ success: false, error: error.message });
    }
});

// Fetch all annotated staff data
app.get('/annotate-staff', async (req, res) => {
  try {
    const data = await Staff.find();
    res.status(200).send(data);
  } catch (error) {
    console.log("Error: ", error.message);
    res.status(500).send({ success: false, error: error.message });
  }
});

//default display
app.get('/', (req, res) => {
    res.send(`
      <h1>Welcome to the Music Annotation API</h1>
      <p>Available endpoints:</p>
      <ul>
        <li><a href="/annotate-staff">/annotate-staff</a> - View staff annotations</li>
        <li><a href="/api-docs">/api-docs</a> - API documentation (if using Swagger)</li>
      </ul>
    `);
});

app.get("/running", (req, res) => {
    res.status(200).json({status: "running"});
});

app.delete('/annotate-staff', async (req, res) => {
  try {
    await Staff.deleteMany();
    res.status(200).send({ success: true });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});


// Start Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

//to run app: first make sure that mongodb is running (mongod in shell), then run npm start in the terminal. You can verify the api endpoints by going to the browser and typing in localhost:3000/annotate-staff