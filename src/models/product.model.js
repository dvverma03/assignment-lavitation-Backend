const mongoose= require('mongoose')

const productSchema = new mongoose.Schema(
    {
       
        product: {
            type: String,
            required: true
        },
        rate: {
            type: Number,
            required: true
        },
        
        quantity: {
            type: Number,
            required: [true, 'Password is required']
        },
        total:{
            type:Number
        }

    },
    {
        timestamps: true
    }
)
const Product= mongoose.model("Product", productSchema)
module.exports= Product