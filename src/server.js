const express = require("express");
const app = express();
const path = require("path");
const dictionary = require("./dictionary.json");
const os = require("os");
const hostname = os.hostname();
const monk = require("monk");
const SparkMD5 = require("spark-md5");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const env = "development";

const isDev = Boolean(env === "development");

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// see https://expressjs.com/en/guide/behind-proxies.html
app.set("trust proxy", 1);

if (!isDev) {
  const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  });

  //  apply to all requests
  app.use(limiter);
}

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || "localhost";
const SECRET = process.env.SECRET || "top_secret";
const PROTOCOL = "http:";
const DICTIONARY = Object.keys(dictionary);

const db = monk(process.env.MONGODB_URI);
const urls = db.get("urls");
urls.createIndex({ slug: 1 }, { unique: true });

app.use(
  express.static(path.join(__dirname, "..", "public"), { maxAge: "12h" })
);
app.use(express.json());

const INDEX_PATH = path.join(__dirname, "index.html");

app.post("/url", async (req, res) => {
  console.log("/url", req.params);
  const toUrl = req.body.toUrl;
  const slug = createLongURL();
  const hash = getHash(slug);
  const newUrl = `${PROTOCOL}//${HOSTNAME}${PORT ? ":" + PORT : ""}/${slug}`;

  const created = await urls.insert({ slug: slug, url: newUrl, toUrl, hash });
  res.json(created);
});

app.get("/:id", async (req, res) => {
  console.log("/:id", req.params);
  if (req.params.id) {
    const record = await urls.findOne({ hash: getHash(req.params.id) });

    if (record && record.toUrl) {
      return res.redirect(record.toUrl);
    } else {
      return res.status(404).json({});
    }
  }

  res.sendFile(INDEX_PATH);
});

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});

function createLongURL() {
  const urlWords = [];
  while (urlWords.length < 3) {
    urlWords.push(DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)]);
  }
  return encodeURIComponent(urlWords.join("-").toLowerCase());
}

function getHash(slug) {
  return SparkMD5.hash(slug + SECRET);
}
