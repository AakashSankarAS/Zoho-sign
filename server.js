const express = require("express");
const fs = require("fs");
const FormData = require("form-data");
const fetch = require("node-fetch");
const path = require("path");
const cors = require("cors");
const app = express();
const port = 4000;
app.use(cors());
app.get("/auth", async (req, res) => {
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

  let files = ["doc.pdf"];
  var payload = new FormData();
  if (fs.existsSync(files[0])) {
    let value = fs.createReadStream(files[0]);

    payload.append("file", value);
  } else {
    return "unable to read file";
  }
  payload.append("data", JSON.stringify(data));
  let HEADERS = {};
  HEADERS["Authorization"] =
    "Zoho-oauthtoken 1000.c3a11d02149ac6910513763d33d9ceae.ca287627b3d0eda75079127e1272557c";

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
  fieldJson["x_coord"] = "300";
  fieldJson["y_coord"] = "300";
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
        };
        res.send(data);
      });
    })
    .catch((error) => {
      let errorResponse = {};
      errorResponse["message"] = "call failed to initiate"; //check internet connection or proper DC type
      errorResponse["status"] = "failure";
      return errorResponse;
    });
});
app.get("/", (req, res) => {
  res.send("Hello World");
});
app.listen(port, () => {
  console.log(`Example app listening on port  {port}`);
});
