const express = require("express");
const axios = require("axios");
const OpenAI = require("openai");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const serverless = require("serverless-http");

const app = express();

const getRawBody = require("raw-body");

app.use(bodyParser.json({ extended: false }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const corsOptions = {
  origin: ["http://localhost:5173"],
};

app.use(
  cors({
    credentials: true,
    origin: corsOptions,
    methods: "post, GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
    allowedHeaders:
      "X-PINGOTHER, Content-Type, X-Requested-With, Authorization, Application-Context, recaptcha, Apollo-Require-Preflight",
    optionsSuccessStatus: 204,
  })
);

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

app.get("/", (req, res) => res.send("Quantum Swim API"));

app.post("/test", async (req, res) => {
  res.send({ working: true });
});

app.post("/summarygenerator", async (req, res) => {
  const message = req?.body[0]?.message;

  const params = {
    api_key: process.env.VALUE_SERP_API_KEY,
    q: message,
    hl: "en",
    page: "1",
    max_page: "3",
  };

  let scrapedData = axios
    .get("https://api.valueserp.com/search", { params })
    .then((response) => {
      return JSON.stringify(response.data, 0, 2);
    })
    .catch((error) => {
      // catch and print the error
      console.log(error);
    });

  scrapedData = await Promise.resolve(scrapedData);

  const info = JSON.parse(scrapedData);

  let referenceContent = "";
  info.organic_results.forEach((ans) => {
    referenceContent +=
      " " +
      `Headline: ${ans.title} \n` +
      ans.snippet +
      "\n" +
      `Source: ${ans.domain}`;
  });

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant.",
      },
      {
        role: "assistant",
        content: `Use this information to answer user: ${referenceContent} `,
      },
      {
        role: "user",
        content: `Assitant use the info provided to repsond to ${message} `,
      },
    ],
    // model: "gpt-3.5-turbo-0125",
    model: "gpt-4",
    max_tokens: 2500,
  });

  const llmResponse = await Promise.resolve(completion);

  res.send(llmResponse.choices[0].message.content);
});

app.listen(5000, () => console.log("Server on port 5000"));

module.exports = app;
