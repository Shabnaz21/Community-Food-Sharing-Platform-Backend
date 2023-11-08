const express = require('express')
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors(
    {
        origin: [
            'https://share-plate-1d8b2.web.app',
            'https://share-plate-1d8b2.firebaseapp.com'
            // 'http://localhost:5173'
            
        ],
        credentials: true
    }
));
app.use(express.json());
app.use(cookieParser());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0s8hpk2.mongodb.net/SharePlate?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Connection Collection
const foodCollection = client.db('SharePlate').collection('Foods')
const RequestCollection = client.db('SharePlate').collection('RequestsFood')


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        // All Foods
        app.post('/foods', async (req, res) => {
            const food = req.body;
            const result = await foodCollection.insertOne(food);
            res.send(result);
        })

        // sorting & Filtering
        // pagination
        app.get('/foods', async (req, res) => {
            let queryObj = {};
            let sortObj = {};

            const foodName = req.query.foodName;
            const sortField = req.query.sortField;
            const sortOrder = req.query.sortOrder;

            // pagination
            const page = Number(req.query.page);
            const limit = Number(req.query.limit);
            const skip = (page - 1) * limit;

            // filter
            if (foodName) {
                queryObj.foodName = foodName;
            }
            
            // sorting
            if (sortField && sortOrder) {
                sortObj[sortField] = sortOrder
            }
 
            const foodFind = foodCollection.find(queryObj).skip(skip).limit(limit).sort(sortObj);
            const result = await foodFind.toArray();
            const total = await foodCollection.countDocuments()
            res.send({
                total,
                result
            });
        })

        app.get('/foods/:id',  async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodCollection.findOne(query);
            // console.log(result);
            res.send(result);
        })
        app.delete('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id),
            };
            const result = await RequestCollection.deleteOne(query);
            res.send(result);
        })



        //Request Part
        app.post('/food-request', async (req, res) => {
            const foods = req.body;
            const result = await RequestCollection.insertOne(foods);
            res.send(result);
        })

        app.get('/food-request',  async (req, res) => {
            console.log('token owner info', req.user);
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: 'Forbidden access' })
            }
            let query = {};
            if (req.query?.email) {
                query={email: req.query.email}
            }
            const result = await RequestCollection.find(query).toArray();
            res.send(result);
        })

        app.patch('/food-request/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const UpdatedFoodData = req.body;
            const updatedReq = {
                $set: {
                    status: UpdatedFoodData.status
                },
            };
            const result = await RequestCollection.updateOne(filter, updatedReq)
            res.send(result)
        })

        app.delete('/food-request/:id',  async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id),
            };
            const result = await RequestCollection.deleteOne(query);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Share Plate data Server is running')
})

app.listen(port, () => {
    console.log(`Share Plate data Server listening on port ${port}`)
})