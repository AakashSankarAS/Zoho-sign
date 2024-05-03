const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const fs = require("fs");
const FormData = require("form-data");
const fetch = require("node-fetch");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

const app = express();
dotenv.config();
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
var name;
var token;
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "docs/");
  },
  filename: (req, file, cb) => {
    cb(null, (name = Date.now() + "-" + file.originalname));
  },
});

const authToken = async () => {
  token = await fetch(
    "https://accounts.zoho.in/oauth/v2/token?refresh_token=" +
      process.env.RFToken +
      "&client_id=" +
      process.env.CId +
      "&client_secret=" +
      process.env.CSecret +
      "&redirect_uri=https%3A%2F%2Fsign.zoho.com&grant_type=refresh_token",
    { method: "POST" }
  )
    .then((elem) => elem.json())
    .then((data) => data);
};
authToken();
setInterval(authToken, 1000 * 60 * 59);
const uploadStorage = multer({ storage: storage });
app.use(cors());

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 25,
  secure: false,
  auth: {
    user: "aakashsankar412@gmail.com",
    pass: "jjktrrckuhwznvhn",
  },
  tls: {
    rejectUnauthorized: false,
  },
});
app.post("/auth", uploadStorage.single("file"), async (req, res) => {
  let actionsJson = {};
  actionsJson["recipient_name"] = "aakash";
  actionsJson["recipient_email"] = "aakashsankar412@gmail.com";
  actionsJson["action_type"] = "SIGN";
  actionsJson["private_notes"] = "Please get back to us for further queries";
  actionsJson["signing_order"] = 0;
  actionsJson["verify_recipient"] = true;
  actionsJson["verification_type"] = "EMAIL";
  actionsJson["is_embedded"] = true;

  let documentJson = {};
  documentJson["request_name"] = "testDoc";
  documentJson["expiration_days"] = 2;
  documentJson["is_sequential"] = true;
  documentJson["email_reminders"] = true;
  documentJson["reminder_period"] = 8;
  documentJson["actions"] = new Array(actionsJson);

  let data = {};
  data["requests"] = documentJson;

  let files = [`docs/${name}`];
  var payload = new FormData();
  if (fs.existsSync(files[0])) {
    let value = fs.createReadStream(files[0]);
    payload.append("file", value);
  } else {
    return "unable to read file";
  }
  payload.append("data", JSON.stringify(data));
  let HEADERS = {};
  HEADERS["Authorization"] = `Zoho-oauthtoken ${token.access_token}`;
  let URL = "https://sign.zoho.in/api/v1/requests";
  let method = "POST";
  let requestOptions = {
    method: method,
    headers: HEADERS,
    body: payload,
  };

  let response = await fetch(URL, requestOptions)
    .then((_res) => {
      console.log(`Return code is ${_res.status}`);
      return _res.json().then((responseJson) => {
        console.log(responseJson);
        return responseJson["requests"];
      });
    })
    .catch((error) => {
      let errorResponse = {};
      errorResponse["message"] = "call failed to initiate"; //check internet connection or proper DC type
      errorResponse["status"] = "failure";
      return errorResponse;
    });

  var request_id = response.request_id;
  var action_id = response.actions[0].action_id;
  let actionsJson1 = {};
  actionsJson1["action_id"] = response.actions[0].action_id;
  actionsJson1["recipient_name"] = response.actions[0].recipient_name;
  actionsJson1["recipient_email"] = response.actions[0].recipient_email;
  actionsJson1["action_type"] = response.actions[0].action_type;

  let fieldJson = {};
  fieldJson["document_id"] = response.document_ids[0].document_id;
  fieldJson["field_name"] = "Signature";
  fieldJson["field_type_name"] = "Signature";
  fieldJson["field_label"] = "Text - 1";
  fieldJson["field_category"] = "Signature";
  fieldJson["abs_width"] = "200";
  fieldJson["abs_height"] = "40";
  fieldJson["is_mandatory"] = true;
  fieldJson["x_coord"] = "350";
  fieldJson["y_coord"] = "550";
  fieldJson["page_no"] = 0;

  actionsJson1["fields"] = new Array(fieldJson);
  let documentJson1 = {};
  documentJson1["actions"] = new Array(actionsJson1);
  let data1 = {};
  data1["requests"] = documentJson1;
  var payload1 = new FormData();
  payload1.append("data", JSON.stringify(data1));
  let URL1 = "https://sign.zoho.in/api/v1/requests/" + request_id + "/submit";
  let requestOptions1 = {
    method: "POST",
    headers: HEADERS,
    body: payload1,
  };

  let response1 = await fetch(URL1, requestOptions1)
    .then((_res1) => {
      console.log(`Return code is ${_res1.status}`);
      return _res1.json().then((responseJson1) => {
        return responseJson1["requests"];
      });
    })
    .catch((error) => {
      let errorResponse = {};
      errorResponse["message"] = "call failed to initiate"; //check internet connection or proper DC type
      errorResponse["status"] = "failure";
      return errorResponse;
    });

  var payload = new FormData();
  payload.append("host", "https://srmn.vercel.app");
  let URL2 =
    "https://sign.zoho.in/api/v1/requests/" +
    request_id +
    "/actions/" +
    action_id +
    "/embedtoken";
  let requestOptions2 = {
    method: "POST",
    headers: HEADERS,
    body: payload,
  };
  return fetch(URL2, requestOptions2)
    .then((_res1) => {
      console.log(`Return code is ${_res1.status}`);
      return _res1.json().then((responseJson1) => {
        let data = {
          url: responseJson1.sign_url,
          req_id: request_id,
        };
        res.send(data);
      });
    })
    .catch((error) => {
      let errorResponse = {};
      errorResponse["message"] = "call failed to initiate";
      errorResponse["status"] = "failure";
      return errorResponse;
    });
});
app.get("/getdocument", async (req, res) => {
  let ID = req.query.id;
  const document = await fetch(
    "https://sign.zoho.in/api/v1/requests/" + ID + "/pdf",
    {
      headers: {
        Authorization: `Zoho-oauthtoken ${token.access_token}`,
      },
    }
  );
  const blob = await document.buffer();

  const base = blob.toString("base64");

  res.send({ pdf: base });
});
app.post("/sendmail", (req, res) => {
  const mailOptions = {
    from: "aakashsankar412@gmail.com",
    to: req.body.to,
    subject: req.body.subject,
    html: req.body.html,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      return res.status(500).send(error);
    }
    res
      .status(200)
      .send({ statuscode: 200, message: "Email sent successfully" });
  });
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(process.env.Port, () => {
  console.log(`Example app listening on port  ${process.env.Port}`);
});
