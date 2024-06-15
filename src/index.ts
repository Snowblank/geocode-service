import axios from 'axios';
import express, { Request, Response } from 'express';
import * as dotenv from 'dotenv';

interface IResponseResultData {
    results: any[];
    status: string;
}

dotenv.config();

const app = express();
app.use(express.json());

app.get('', (req: Request, res: Response) => {
    return res.status(200).send("OK")
})

app.post('/getPostalCode', async (req: Request, res: Response) => {
    const address = req.body.address;
    if (!address) {
        res.status(400).send('Address is required.');
        return;
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        res.status(500).send('Google API key is not set.');
        return;
    }

    try {
        const response = await axios.get<IResponseResultData>('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: address,
                key: apiKey
            }
        });

        const responseData = response.data;
        const result = responseData.results;
        console.log("responseData", responseData)

        if (result.length < 1 || !result[0]?.address_components) {
            return res.status(200).send({ postalCode: null, source: "not found" })
        }

        const postalCodeComponent = result[0].address_components.find((component: { types: string[]; }) =>
            component.types.includes('postal_code')
        );

        if (postalCodeComponent) {
            return res.status(200).send({ postalCode: postalCodeComponent.long_name, source: "new geo" })
        }

        return res.status(200).send({ postalCode: null, source: "not found" })
    } catch (error: any) {
        console.log("erro", error)
        res.status(500).send('Error occurred: ' + error.message);
    }
});

const port = 8111;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
